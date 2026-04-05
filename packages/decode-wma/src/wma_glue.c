/**
 * RockBox fixed-point WMA WASM glue — bridge between JS and standalone wmadeci.
 *
 * Exposes create/decode/close for WMA v1/v2 (no Pro/Lossless).
 * Uses RockBox's fixed-point decoder from lib/rockbox-wma/.
 */

#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

/* Pull in the decoder — it's a single-file implementation.
   wmadeci.c typedefs are patched out by build.sh (conflict with stdint.h). */
#include "_wmadeci_patched.c"

typedef struct {
    CodecContext ctx;
    AVCodec *codec;
    WMADecodeContext wma;
} WMAHandle;

static float *out_buf = NULL;
static int out_cap = 0;
static int out_samples = 0;
static int out_channels = 0;
static int out_samplerate = 0;

EXPORT void *wma_create(int channels, int sample_rate, int bit_rate,
                         int block_align, int format_tag, int bits_per_sample,
                         unsigned char *extra, int extra_len) {
    AVCodec *codec = NULL;

    /* Only WMAv1 (0x0160) and WMAv2 (0x0161) supported by RockBox decoder */
    if (format_tag == 0x0160) {
        codec = &wmav1i_decoder;
    } else if (format_tag == 0x0161) {
        codec = &wmav2i_decoder;
    } else {
        return NULL;
    }

    WMAHandle *h = (WMAHandle *)calloc(1, sizeof(WMAHandle));
    if (!h) return NULL;

    h->codec = codec;
    h->ctx.codec = codec;
    h->ctx.codec_id = codec->id;
    h->ctx.codec_type = CODEC_TYPE_AUDIO;
    h->ctx.channels = channels;
    h->ctx.sample_rate = sample_rate;
    h->ctx.bit_rate = bit_rate;
    h->ctx.block_align = block_align;
    h->ctx.bits_per_sample = bits_per_sample;
    h->ctx.priv_data = &h->wma;

    if (extra && extra_len > 0) {
        h->ctx.extradata = malloc(extra_len);
        if (h->ctx.extradata) {
            memcpy(h->ctx.extradata, extra, extra_len);
            h->ctx.extradata_size = extra_len;
        }
    }

    /* Initialize decoder */
    if (codec->init(&h->ctx) < 0) {
        free(h->ctx.extradata);
        free(h);
        return NULL;
    }

    return h;
}

EXPORT float *wma_decode(void *handle, unsigned char *buf, int len) {
    WMAHandle *h = (WMAHandle *)handle;
    if (!h) return NULL;

    out_samples = 0;
    out_channels = h->ctx.channels;
    out_samplerate = h->ctx.sample_rate;

    /* Allocate sample buffer for one superframe decode.
     * Max frame_len is 2048, max channels is 2, output is interleaved int16_t.
     * We allocate conservatively. */
    int max_samples = 2048 * 2 * 4; /* generous: multiple frames in superframe */
    int16_t *pcm = (int16_t *)calloc(max_samples, sizeof(int16_t));
    if (!pcm) return NULL;

    int data_size = 0;
    int ret = h->codec->decode(&h->ctx, pcm, &data_size, buf, len);

    if (ret < 0 || data_size <= 0) {
        free(pcm);
        return NULL;
    }

    /* data_size is in bytes; convert to sample count */
    int total_int16 = data_size / sizeof(int16_t);
    /* total_int16 is interleaved: ch0, ch1, ch0, ch1, ... */
    int total_float = total_int16;

    if (total_float > out_cap) {
        free(out_buf);
        out_cap = total_float;
        out_buf = (float *)malloc(total_float * sizeof(float));
    }

    /* Convert int16 interleaved -> float interleaved */
    for (int i = 0; i < total_float; i++) {
        out_buf[i] = pcm[i] / 32768.0f;
    }

    free(pcm);
    out_samples = total_float;
    return out_buf;
}

EXPORT int wma_samples(void) { return out_samples; }
EXPORT int wma_channels(void) { return out_channels; }
EXPORT int wma_samplerate(void) { return out_samplerate; }

EXPORT void wma_close(void *handle) {
    WMAHandle *h = (WMAHandle *)handle;
    if (!h) return;
    if (h->codec && h->codec->close) {
        h->codec->close(&h->ctx);
    }
    free(h->ctx.extradata);
    free(h);
}

EXPORT void wma_free_buf(void) {
    free(out_buf);
    out_buf = NULL;
    out_cap = 0;
    out_samples = 0;
}
