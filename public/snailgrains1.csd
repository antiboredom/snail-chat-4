<CsoundSynthesizer>
<CsOptions>
-odac
</CsOptions>

<CsInstruments>
sr = 48000
ksmps = 128
nchnls = 2
0dbfs = 1

giSine ftgen 0, 0, 65537, 10, 1 ; sine wave
giCosine ftgen 0, 0, 8193, 9, 1, 1, 90 ; cosine wave
giSigmoRise ftgen 0, 0, 8193, 19, 0.5, 1, 270, 1 ; rising sigmoid
giSigmoFall ftgen 0, 0, 8193, 19, 0.5, 1, 90, 1 ; falling sigmoid
giExpFall ftgen 0, 0, 8193, 5, 1, 8193, 0.00001 ; exponential decay
giTriangleWin ftgen 0, 0, 8193, 7, 0, 4096, 1, 4096, 0 ; triangular window


; granular synthesizer
instr 1

  kamp chnget "amp"
  kx chnget "X"
  ky chnget "Y"

  ; grain rate
  kGrainRate = 4+(kx*20)
  kwavfreq = 1.0; 1.0+ky ; transposition factor (playback speed) of audio inside grains,
  kGrainDur = 0.8; length of each grain relative to grain rate
  ka_d_ratio = 0.3 ; balance between attack time and decay time, 0.0 = zero attack time and full decay time
  kPtchFmIndex = ky*10 ; FM index, modulating waveform pitch
  koctaviation = 0

  ; original pitch for each waveform, use if they should be transposed individually
  kwavekey1 = 440
  kwavekey2 = 1040
  kwavekey3 = 2250
  kwavekey4 = 2450

  ; grain shape
  kduration = (kGrainDur*1000)/kGrainRate ; grain dur in milliseconds, relative to grain rate

  ksustain_amount = 0.0 ; balance between enveloped time(attack+decay) and sustain level time, 0.0 = no time at sustain level
  kenv2amt = 0.0 ; amount of secondary enveloping per grain (e.g. for fof synthesis)

  ; grain rate FM
  kGrFmFreq = kGrainRate/4 ; FM freq for modulating the grainrate
  kGrFmIndex = 0.0 ; FM index for modulating the grainrate (normally kept in a 0.0 to 1.0 range)
  iGrFmWave = giSine ; FM waveform, for modulating the grainrate
  aGrFmSig oscil kGrFmIndex, kGrFmFreq, iGrFmWave ; audio signal for frequency modulation of grain rate
  agrainrate = kGrainRate + (aGrFmSig*kGrainRate) ; add the modulator signal to the grain rate signal

  ; distribution
  kdistribution = 0.0 ; grain random distribution in time
  idisttab ftgentmp 0, 0, 16, 16, 1, 16, -10, 0 ; probability distribution for random grain masking

  ; pitch sweep
  ksweepshape = 0.5 ; grain wave pitch sweep shape (sweep speed), 0.5 is linear sweep
  iwavfreqstarttab ftgentmp 0, 0, 16, -2, 0, 0, 1 ; start freq scalers, per grain
  iwavfreqendtab ftgentmp 0, 0, 16, -2, 0, 0, 1 ; end freq scalers, per grain

  ; FM of grain pitch (playback speed)
  kPtchFmFreq = 440*kwavfreq*2 ; FM freq, modulating waveform pitch
  iPtchFmWave = giSine ; FM waveform, modulating waveform pitch
  ifmamptab ftgentmp 0, 0, 16, -2, 0, 0, 1 ; FM index scalers, per grain
  ifmenv = giTriangleWin ; FM index envelope, over each grain (from table)
  kPtchFmIndex = kPtchFmIndex + (kPtchFmIndex*kPtchFmFreq*0.00001) ; FM index scaling formula
  awavfm oscil kPtchFmIndex, kPtchFmFreq, iPtchFmWave ; Modulator signal for frequency modulation inside grain

  ; trainlet parameters
  kTrainCps = kGrainRate ; set cps equal to grain freq, creating a single cycle of a trainlet inside each grain
  knumpartials = 7 ; number of partials in trainlet
  kchroma = 3 ; chroma, falloff of partial amplitude towards sr/2

  ; masking
  ; gain masking table, amplitude for individual grains
  igainmasks	ftgentmp	0, 0, 16, -2, 0, 3, 1, 1, 1, 1
  tablew 1-limit(koctaviation,0,1), 3, igainmasks
  tablew 1-limit(koctaviation,0,1), 5, igainmasks
  tablew 1-limit((koctaviation-1),0,1), 4, igainmasks

  ; channel masking table, output routing for individual grains (zero based, a value of 0.0 routes to output 1)
  ichannelmasks	ftgentmp	0, 0, 16, -2,  1, 0.4, 0.6
  ; random masking (muting) of individual grains
  krandommask	= 0

  ; wave mix masking.
  iwaveamptab	ftgentmp	0, 0, 32, -2, 0, 0,   1,0,0,0,0

  imax_grains	= 100				; max number of grains per k-period
  async = 0.0 ; set the sync input to zero (disable external sync)
  asamplepos = 0

  a1,a2 partikkel agrainrate, kdistribution, idisttab, async, kenv2amt, giExpFall, \
    giSigmoRise, giSigmoFall, ksustain_amount, ka_d_ratio, kduration, kamp, igainmasks, \
    kwavfreq, ksweepshape, iwavfreqstarttab, iwavfreqendtab, awavfm, \
    ifmamptab, ifmenv, giCosine, kTrainCps, knumpartials, \
    kchroma, ichannelmasks, krandommask, giSine, giSine, giSine, giSine, \
    iwaveamptab, asamplepos, asamplepos, asamplepos, asamplepos, \
    kwavekey1, kwavekey2, kwavekey3, kwavekey4, imax_grains

  outs a1, a2
endin

</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>
