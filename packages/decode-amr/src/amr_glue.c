/**
 * opencore-amr WASM glue — bridge between JS and AMR-NB/WB decoders
 */

#include <stdlib.h>
#include <string.h>

#include "interf_dec.h"
#include "dec_if.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

static short out_nb[160];  /* AMR-NB: 160 samples per frame */
static short out_wb[320];  /* AMR-WB: 320 samples per frame */
static float out_f[320];   /* float output (max of both) */

/* --- AMR-NB --- */

EXPORT void* amr_nb_create(void) {
	return Decoder_Interface_init();
}

EXPORT int amr_nb_decode(void* h, unsigned char* buf, int len) {
	/* Decoder_Interface_Decode is void — opencore-amr NB decoder has no error return.
	   Decoding errors produce silence/comfort noise rather than signaling failure. */
	Decoder_Interface_Decode(h, buf, out_nb, 0);
	for (int i = 0; i < 160; i++) out_f[i] = out_nb[i] / 32768.0f;
	return 160;
}

EXPORT float* amr_nb_output(void) { return out_f; }

EXPORT void amr_nb_close(void* h) {
	Decoder_Interface_exit(h);
}

/* --- AMR-WB --- */

EXPORT void* amr_wb_create(void) {
	return D_IF_init();
}

EXPORT int amr_wb_decode(void* h, unsigned char* buf, int len) {
	/* D_IF_decode is void — opencore-amr WB decoder has no error return.
	   Decoding errors produce silence/comfort noise rather than signaling failure. */
	D_IF_decode(h, buf, out_wb, 0);
	for (int i = 0; i < 320; i++) out_f[i] = out_wb[i] / 32768.0f;
	return 320;
}

EXPORT float* amr_wb_output(void) { return out_f; }

EXPORT void amr_wb_close(void* h) {
	D_IF_exit(h);
}
