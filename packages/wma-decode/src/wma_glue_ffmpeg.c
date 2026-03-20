/**
 * FFmpeg WMA WASM glue — minimal bridge between JS and libavcodec wmadec
 *
 * Exposes create/decode/close for WMA v1/v2/Pro/Lossless.
 * Requires FFmpeg libavcodec + libavutil sources in lib/ffmpeg/.
 */

#include <stdlib.h>
#include <string.h>

#include "libavcodec/avcodec.h"
#include "libavutil/opt.h"
#include "libavutil/mem.h"
#include "libavutil/channel_layout.h"
#include "libavutil/error.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

typedef struct {
    const AVCodec *codec;
    AVCodecContext *ctx;
    AVPacket *pkt;
    AVFrame *frame;
} WMAHandle;

static float *out_buf = NULL;
static int out_cap = 0;
static int out_samples = 0;
static int out_channels = 0;
static int out_samplerate = 0;

static enum AVCodecID tag_to_id(int tag) {
    switch (tag) {
        case 0x0160: return AV_CODEC_ID_WMAV1;
        case 0x0161: return AV_CODEC_ID_WMAV2;
        case 0x0162: return AV_CODEC_ID_WMAPRO;
        case 0x0163: return AV_CODEC_ID_WMALOSSLESS;
        default:     return AV_CODEC_ID_NONE;
    }
}

EXPORT void *wma_create(int channels, int sample_rate, int bit_rate,
                         int block_align, int format_tag, int bits_per_sample,
                         unsigned char *extra, int extra_len) {
    enum AVCodecID id = tag_to_id(format_tag);
    if (id == AV_CODEC_ID_NONE) return NULL;

    const AVCodec *codec = avcodec_find_decoder(id);
    if (!codec) return NULL;

    AVCodecContext *ctx = avcodec_alloc_context3(codec);
    if (!ctx) return NULL;

    av_channel_layout_default(&ctx->ch_layout, channels);
    ctx->sample_rate = sample_rate;
    ctx->bit_rate = bit_rate;
    ctx->block_align = block_align;
    ctx->bits_per_coded_sample = bits_per_sample;

    if (extra && extra_len > 0) {
        ctx->extradata = av_mallocz(extra_len + AV_INPUT_BUFFER_PADDING_SIZE);
        if (ctx->extradata) {
            memcpy(ctx->extradata, extra, extra_len);
            ctx->extradata_size = extra_len;
        }
    }

    if (avcodec_open2(ctx, codec, NULL) < 0) {
        avcodec_free_context(&ctx);
        return NULL;
    }

    WMAHandle *h = (WMAHandle *)malloc(sizeof(WMAHandle));
    if (!h) { avcodec_free_context(&ctx); return NULL; }

    h->codec = codec;
    h->ctx = ctx;
    h->pkt = av_packet_alloc();
    h->frame = av_frame_alloc();

    if (!h->pkt || !h->frame) {
        if (h->pkt) av_packet_free(&h->pkt);
        if (h->frame) av_frame_free(&h->frame);
        avcodec_free_context(&ctx);
        free(h);
        return NULL;
    }

    return h;
}

static void collect_frames(WMAHandle *h, float **tmp, int *tmp_cap, int *total) {
    int ret;
    while (1) {
        ret = avcodec_receive_frame(h->ctx, h->frame);
        if (ret != 0) break;

        int ch = h->frame->ch_layout.nb_channels;
        if (!ch) ch = h->ctx->ch_layout.nb_channels;
        int nb = h->frame->nb_samples;
        int n = ch * nb;
        int needed = *total + n;

        if (needed > *tmp_cap) {
            *tmp_cap = needed + 4096;
            *tmp = (float *)realloc(*tmp, *tmp_cap * sizeof(float));
        }

        out_channels = ch;
        out_samplerate = h->frame->sample_rate ? h->frame->sample_rate : h->ctx->sample_rate;

        /* Convert to interleaved float */
        enum AVSampleFormat fmt = h->frame->format;
        for (int s = 0; s < nb; s++) {
            for (int c = 0; c < ch; c++) {
                float val = 0.0f;
                if (fmt == AV_SAMPLE_FMT_FLTP) {
                    val = ((float *)h->frame->data[c])[s];
                } else if (fmt == AV_SAMPLE_FMT_FLT) {
                    val = ((float *)h->frame->data[0])[s * ch + c];
                } else if (fmt == AV_SAMPLE_FMT_S16P) {
                    val = ((int16_t *)h->frame->data[c])[s] / 32768.0f;
                } else if (fmt == AV_SAMPLE_FMT_S16) {
                    val = ((int16_t *)h->frame->data[0])[s * ch + c] / 32768.0f;
                } else if (fmt == AV_SAMPLE_FMT_S32P) {
                    val = ((int32_t *)h->frame->data[c])[s] / 2147483648.0f;
                } else if (fmt == AV_SAMPLE_FMT_S32) {
                    val = ((int32_t *)h->frame->data[0])[s * ch + c] / 2147483648.0f;
                }
                (*tmp)[(*total)++] = val;
            }
        }

        av_frame_unref(h->frame);
    }
}

EXPORT float *wma_decode(void *handle, unsigned char *buf, int len) {
    WMAHandle *h = (WMAHandle *)handle;
    if (!h || !h->ctx) return NULL;

    out_samples = 0;
    out_channels = h->ctx->ch_layout.nb_channels;
    out_samplerate = h->ctx->sample_rate;

    h->pkt->data = buf;
    h->pkt->size = len;

    int total = 0;
    float *tmp = NULL;
    int tmp_cap = 0;

    /* Send packet, handling EAGAIN by draining first */
    int ret = avcodec_send_packet(h->ctx, h->pkt);
    if (ret == AVERROR(EAGAIN)) {
        collect_frames(h, &tmp, &tmp_cap, &total);
        ret = avcodec_send_packet(h->ctx, h->pkt);
    }
    if (ret < 0 && ret != AVERROR_EOF) { free(tmp); return NULL; }

    /* Collect all output frames */
    collect_frames(h, &tmp, &tmp_cap, &total);

    if (!total) { free(tmp); return NULL; }

    /* Copy to persistent output buffer */
    if (total > out_cap) {
        free(out_buf);
        out_cap = total;
        out_buf = (float *)malloc(total * sizeof(float));
    }
    memcpy(out_buf, tmp, total * sizeof(float));
    free(tmp);
    out_samples = total;

    return out_buf;
}

EXPORT int wma_samples(void) { return out_samples; }
EXPORT int wma_channels(void) { return out_channels; }
EXPORT int wma_samplerate(void) { return out_samplerate; }

EXPORT void wma_close(void *handle) {
    WMAHandle *h = (WMAHandle *)handle;
    if (!h) return;
    if (h->frame) av_frame_free(&h->frame);
    if (h->pkt) av_packet_free(&h->pkt);
    if (h->ctx) avcodec_free_context(&h->ctx);
    free(h);
}

EXPORT void wma_free_buf(void) {
    free(out_buf);
    out_buf = NULL;
    out_cap = 0;
    out_samples = 0;
}
