/**
 * FAAD2 WASM glue — minimal bridge between JS and libfaad
 *
 * Note: memcpy to out_buf is required — FAAD2's internal sample_buffer
 * produces corrupt reads without it under Emscripten optimization.
 */

#include <stdlib.h>
#include <string.h>
#include "neaacdec.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

static NeAACDecFrameInfo info;

static float *out_buf = NULL;
static unsigned long out_cap = 0;

EXPORT NeAACDecHandle aac_create(void) {
	NeAACDecHandle h = NeAACDecOpen();
	NeAACDecConfigurationPtr cfg = NeAACDecGetCurrentConfiguration(h);
	cfg->outputFormat = FAAD_FMT_FLOAT;
	cfg->dontUpSampleImplicitSBR = 0;
	NeAACDecSetConfiguration(h, cfg);
	return h;
}

EXPORT long aac_init(NeAACDecHandle h, unsigned char *buf, unsigned long len,
	unsigned long *sr, unsigned char *ch) {
	return NeAACDecInit(h, buf, len, sr, ch);
}

EXPORT int aac_init2(NeAACDecHandle h, unsigned char *asc, unsigned long asc_len,
	unsigned long *sr, unsigned char *ch) {
	return (int)NeAACDecInit2(h, asc, asc_len, sr, ch);
}

EXPORT float *aac_decode(NeAACDecHandle h, unsigned char *buf, unsigned long len) {
	memset(&info, 0, sizeof(info));
	void *samples = NeAACDecDecode(h, &info, buf, len);
	if (info.error || !info.samples || !samples) return NULL;

	unsigned long n = info.samples;
	if (n > out_cap) {
		free(out_buf);
		out_cap = n;
		out_buf = (float *)malloc(n * sizeof(float));
	}
	memcpy(out_buf, samples, n * sizeof(float));
	return out_buf;
}

EXPORT unsigned long aac_samples(void) { return info.samples; }
EXPORT unsigned char aac_channels(void) { return info.channels; }
EXPORT unsigned long aac_samplerate(void) { return info.samplerate; }
EXPORT unsigned long aac_consumed(void) { return info.bytesconsumed; }
EXPORT unsigned char aac_error(void) { return info.error; }

EXPORT const char *aac_error_msg(unsigned char code) {
	return NeAACDecGetErrorMessage(code);
}

EXPORT void aac_close(NeAACDecHandle h) {
	NeAACDecClose(h);
}

EXPORT void aac_free_buf(void) {
	free(out_buf);
	out_buf = NULL;
	out_cap = 0;
}

static unsigned long _sr;
static unsigned char _ch;
EXPORT unsigned long *aac_sr_ptr(void) { return &_sr; }
EXPORT unsigned char *aac_ch_ptr(void) { return &_ch; }
