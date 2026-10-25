import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Film,
  Music,
  ScanSearch,
  Upload,
  Download,
  Sparkles,
} from 'lucide-react';

type StudioTab = 'image' | 'video' | 'music' | 'analyze';

export const MultimodalStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('image');

  // Image Generation & Editing State — Unlimited Gemini Nano Banana 2.1 (No Limit)
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgModel, setImgModel] = useState<
    'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image' | 'gemini-3-pro-image-preview'
  >('gemini-nano-banana-2.1');
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imgAspect, setImgAspect] = useState<
    '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '1:4' | '4:1' | '1:8' | '8:1'
  >('1:1');
  const [refImageBase64, setRefImageBase64] = useState<string | null>(null);
  const [refImageMime, setRefImageMime] = useState<string>('image/png');
  const [refImageName, setRefImageName] = useState<string>('');
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [generatedNanoPrompt, setGeneratedNanoPrompt] = useState<string>('');
  const [isConvertingNanoPrompt, setIsConvertingNanoPrompt] = useState<boolean>(false);
  const [nanoBananaGallery, setNanoBananaGallery] = useState<
    { id: string; url: string; prompt: string; nanoBananaPrompt?: string; model: string }[]
  >([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState('');

  // Video Generation & Animation State (gemini-omni-1.1-flash via Interactions API)
  const [vidPrompt, setVidPrompt] = useState('');
  const [vidAspect, setVidAspect] = useState<'16:9' | '9:16'>('16:9');
  const [vidDuration, setVidDuration] = useState<'5s' | '10s'>('5s');
  const [vidPhotoBase64, setVidPhotoBase64] = useState<string | null>(null);
  const [vidPhotoMime, setVidPhotoMime] = useState<string>('image/png');
  const [vidPhotoName, setVidPhotoName] = useState<string>('');
  const [generatedVidUrl, setGeneratedVidUrl] = useState<string | null>(null);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidError, setVidError] = useState('');

  // Music Generation State (lyria-3-clip-preview / lyria-3-pro-preview)
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>(
    'lyria-3-clip-preview'
  );
  const [musicAudioUrl, setMusicAudioUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string>('');
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState('');

  // Deep Media Analysis State (gemini-4-argon with High Thinking)
  const [analyzePrompt, setAnalyzePrompt] = useState(
    'Analyze this media in detail. Identify visual or video events, emotional subtext, and key takeaways.'
  );
  const [analyzeBase64, setAnalyzeBase64] = useState<string | null>(null);
  const [analyzeMime, setAnalyzeMime] = useState<string>('');
  const [analyzeFileName, setAnalyzeFileName] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  const handleFileToBase64 = (
    file: File,
    onDone: (base64: string, mime: string, name: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      onDone(base64, file.type || 'application/octet-stream', file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleConvertTextToNanoBananaPrompt = async () => {
    const raw = imgPrompt.trim();
    if (!raw || isConvertingNanoPrompt) return;
    setIsConvertingNanoPrompt(true);
    setImgError('');
    try {
      const res = await fetch('/api/studio/nano-banana-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: raw,
          aspectRatio: imgAspect,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not convert text to Nano Banana prompt.');
      if (data.nanoBananaPrompt) {
        setImgPrompt(data.nanoBananaPrompt);
        setGeneratedNanoPrompt(data.nanoBananaPrompt);
      }
    } catch (err: any) {
      setImgError(err?.message || 'Failed to build Nano Banana prompt.');
    } finally {
      setIsConvertingNanoPrompt(false);
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgPrompt.trim()) return;
    setImgLoading(true);
    setImgError('');
    try {
      const res = await fetch('/api/studio/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgPrompt,
          model: imgModel,
          imageSize: imgSize,
          aspectRatio: imgAspect,
          referenceImageBase64: refImageBase64,
          referenceMimeType: refImageMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');
      setGeneratedImgUrl(data.imageUrl);
      const effectiveNanoPrompt = data.nanoBananaPrompt || imgPrompt;
      setGeneratedNanoPrompt(effectiveNanoPrompt);
      setNanoBananaGallery((prev) => [
        {
          id: `nb_${Date.now()}`,
          url: data.imageUrl,
          prompt: imgPrompt,
          nanoBananaPrompt: effectiveNanoPrompt,
          model: data.modelUsed || imgModel,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setImgError(err?.message || 'Could not generate image.');
    } finally {
      setImgLoading(false);
    }
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidPrompt.trim()) return;
    setVidLoading(true);
    setVidError('');
    try {
      const res = await fetch('/api/studio/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: vidPrompt,
          aspectRatio: vidAspect,
          duration: vidDuration,
          imageBase64: vidPhotoBase64,
          imageMimeType: vidPhotoMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video generation failed');
      setGeneratedVidUrl(data.videoUrl);
    } catch (err: any) {
      setVidError(err?.message || 'Could not generate video.');
    } finally {
      setVidLoading(false);
    }
  };

  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPrompt.trim()) return;
    setMusicLoading(true);
    setMusicError('');
    try {
      const res = await fetch('/api/studio/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          model: musicModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Music generation failed');

      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setMusicAudioUrl(url);
      setMusicLyrics(data.lyrics || '');
    } catch (err: any) {
      setMusicError(err?.message || 'Could not generate music track.');
    } finally {
      setMusicLoading(false);
    }
  };

  const handleAnalyzeMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzeBase64) return;
    setAnalyzeLoading(true);
    setAnalyzeError('');
    try {
      const res = await fetch('/api/studio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analyzePrompt,
          mediaBase64: analyzeBase64,
          mimeType: analyzeMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Media analysis failed');
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setAnalyzeError(err?.message || 'Could not analyze media.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>KARA Multimodal Lab</span>
            <span aria-hidden="true">·</span>
            <span>Nano Banana 2.1 / Pro Image / Omni Flash / Lyria 3 / Argon</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Creative & Analytical Studio
          </h1>
        </div>

        {/* Interactive Segmented Tab Bar */}
        <div className="flex items-center gap-1 p-1 bg-[#0F131C] border border-neutral-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'image'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Lab</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'video'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Omni Video</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'music'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Lyria Music</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analyze')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'analyze'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ScanSearch className="w-3.5 h-3.5" />
            <span>Media Vision</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IMAGE GENERATION & EDITING (UNLIMITED GEMINI NANO BANANA) */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <form
            onSubmit={handleGenerateImage}
            className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Gemini Nano Banana Studio
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Generate or edit unlimited visuals with zero rate limits or quotas.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-[11px] font-mono text-amber-300 whitespace-nowrap shrink-0">
                  No Limit · ∞
                </span>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Nano Banana Engine (Unlimited)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImgModel('gemini-3.1-flash-lite-image')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      imgModel === 'gemini-3.1-flash-lite-image'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Nano Banana Lite
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgModel('gemini-nano-banana-2.1')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      imgModel === 'gemini-nano-banana-2.1'
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Nano Banana 2.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgModel('gemini-3-pro-image-preview')}
                    className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      imgModel === 'gemini-3-pro-image-preview'
                        ? 'bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Nano Banana Pro
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">
                    Image Size (Resolution)
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                    {(['1K', '2K', '4K'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setImgSize(sz)}
                        className={`flex-1 py-1 text-xs font-mono tabular-nums rounded-md transition-colors ${
                          imgSize === sz
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Aspect Ratio</label>
                  <select
                    value={imgAspect}
                    onChange={(e) => setImgAspect(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="4:3">4:3 Editorial</option>
                    <option value="3:4">3:4 Poster</option>
                    <option value="1:4">1:4 Tall Banner</option>
                    <option value="4:1">4:1 Wide Banner</option>
                    <option value="1:8">1:8 Ultra-Tall</option>
                    <option value="8:1">8:1 Ultra-Wide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Optional Reference Image (for Image Editing with gemini-nano-banana-2.1)
                </label>
                <label className="flex items-center justify-between px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer hover:border-neutral-700 text-xs text-neutral-400">
                  <span className="truncate">
                    {refImageName || 'Upload photo to edit (optional)...'}
                  </span>
                  <Upload className="w-3.5 h-3.5 shrink-0 ml-2" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleFileToBase64(f, (b64, mime, name) => {
                          setRefImageBase64(b64);
                          setRefImageMime(mime);
                          setRefImageName(name);
                        });
                      }
                    }}
                  />
                </label>
                {refImageBase64 && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-sky-300">
                      Editing: {refImageName || 'Loaded Image'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRefImageBase64(null);
                        setRefImageName('');
                      }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Clear uploaded image
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs text-neutral-300">
                    {refImageBase64
                      ? 'Image Edit Prompt (gemini-nano-banana-2.1)'
                      : 'Text → Nano Banana 2.1 Image Prompt'}
                  </label>
                  <button
                    type="button"
                    onClick={handleConvertTextToNanoBananaPrompt}
                    disabled={!imgPrompt.trim() || isConvertingNanoPrompt}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/40 text-[11px] font-medium text-amber-300 flex items-center gap-1 transition-colors"
                    title="Convert your plain text idea into a detailed Nano Banana Image Generator Prompt"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isConvertingNanoPrompt
                        ? 'Converting Text...'
                        : 'Text → Nano Banana Prompt'}
                    </span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={imgPrompt}
                  onChange={(e) => setImgPrompt(e.target.value)}
                  placeholder={
                    refImageBase64
                      ? "Describe how to edit the image (e.g. 'Add neon cyberpunk lighting', 'Change background to sunset beach')..."
                      : "Type any plain text idea (e.g. 'cyberpunk rooftop cafe in rain') to create with gemini-nano-banana-2.1..."
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {imgError && <p className="text-xs text-rose-400">{imgError}</p>}

            <button
              type="submit"
              disabled={imgLoading || !imgPrompt.trim()}
              className="w-full py-2.5 px-4 text-xs font-medium bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-400 hover:from-amber-300 hover:to-indigo-300 disabled:opacity-50 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {imgLoading
                  ? 'Synthesizing with gemini-nano-banana-2.1...'
                  : refImageBase64
                  ? 'Edit Image with gemini-nano-banana-2.1'
                  : `Create ${imgSize} Image with gemini-nano-banana-2.1`}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between min-h-80 space-y-4">
            <div className="flex-1 flex flex-col items-center justify-center">
              {generatedImgUrl ? (
                <div className="w-full flex flex-col items-center space-y-4">
                  <img
                    src={generatedImgUrl}
                    alt={imgPrompt || 'Generated studio artwork'}
                    referrerPolicy="no-referrer"
                    className="max-h-96 rounded-xl border border-neutral-800 object-contain"
                  />
                  {generatedNanoPrompt && (
                    <div className="w-full p-3 rounded-xl bg-neutral-900/90 border border-amber-500/30 text-left space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                        <span>Active Nano Banana 2.1 Prompt</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(generatedNanoPrompt)}
                          className="text-sky-400 hover:underline"
                        >
                          Copy Prompt
                        </button>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                        {generatedNanoPrompt}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-mono text-amber-300">
                      gemini-nano-banana-2.1 · Create &amp; Edit
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRefImageBase64(generatedImgUrl);
                        setRefImageMime('image/png');
                        setRefImageName('Generated_Nano_Banana_2.1.png');
                        setImgPrompt('Add dramatic neon lighting and enhance atmospheric details');
                      }}
                      className="px-3.5 py-2 text-xs font-medium bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Edit This Image</span>
                    </button>
                    <a
                      href={generatedImgUrl}
                      download={`kara_nano_banana_${Date.now()}.png`}
                      className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Image</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-xs space-y-2">
                  <ImageIcon className="w-10 h-10 text-amber-400/70 mx-auto" />
                  <p className="text-sm font-medium text-neutral-300">
                    Gemini Nano Banana Ready (No Limit)
                  </p>
                  <p className="text-xs text-neutral-500">
                    Enter any text to auto-convert it into a Nano Banana Image Generator Prompt and synthesize 1K, 2K, or 4K artwork.
                  </p>
                </div>
              )}
            </div>

            {nanoBananaGallery.length > 0 && (
              <div className="pt-3 border-t border-neutral-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Unlimited Session Gallery ({nanoBananaGallery.length} generated)</span>
                  <span className="font-mono text-amber-300">Zero Quota</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {nanoBananaGallery.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGeneratedImgUrl(item.url);
                        setImgPrompt(item.prompt);
                      }}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 transition-all ${
                        generatedImgUrl === item.url
                          ? 'border-amber-400 ring-2 ring-amber-400/30'
                          : 'border-neutral-800 opacity-75 hover:opacity-100'
                      }`}
                      title={item.prompt}
                    >
                      <img
                        src={item.url}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VIDEO GENERATION & IMAGE ANIMATION (gemini-omni-1.1-flash) */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <form
            onSubmit={handleGenerateVideo}
            className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Omni Flash Video Synthesis & Photo Animation
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Powered by gemini-omni-1.1-flash via the Interactions API. Generate video from text or upload a photo to animate it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Aspect Ratio</label>
                  <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                    {(['16:9', '9:16'] as const).map((ar) => (
                      <button
                        key={ar}
                        type="button"
                        onClick={() => setVidAspect(ar)}
                        className={`flex-1 py-1 text-xs font-mono tabular-nums rounded-md transition-colors ${
                          vidAspect === ar
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1.5">Duration</label>
                  <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                    {(['5s', '10s'] as const).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setVidDuration(dur)}
                        className={`flex-1 py-1 text-xs font-mono tabular-nums rounded-md transition-colors ${
                          vidDuration === dur
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Animate Photo Into Video (Optional Starting Frame)
                </label>
                <label className="flex items-center justify-between px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer hover:border-neutral-700 text-xs text-neutral-400">
                  <span className="truncate">
                    {vidPhotoName || 'Upload photo to animate (optional)...'}
                  </span>
                  <Upload className="w-3.5 h-3.5 shrink-0 ml-2" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleFileToBase64(f, (b64, mime, name) => {
                          setVidPhotoBase64(b64);
                          setVidPhotoMime(mime);
                          setVidPhotoName(name);
                        });
                      }
                    }}
                  />
                </label>
                {vidPhotoBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      setVidPhotoBase64(null);
                      setVidPhotoName('');
                    }}
                    className="mt-1 text-xs text-rose-400 hover:underline"
                  >
                    Remove starting frame
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Video / Motion Prompt
                </label>
                <textarea
                  rows={3}
                  value={vidPrompt}
                  onChange={(e) => setVidPrompt(e.target.value)}
                  placeholder="Describe the cinematic motion, camera movement, and atmosphere..."
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {vidError && <p className="text-xs text-rose-400">{vidError}</p>}

            <button
              type="submit"
              disabled={vidLoading || !vidPrompt.trim()}
              className="w-full py-2.5 px-4 text-xs font-medium bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Film className="w-4 h-4" />
              <span>
                {vidLoading
                  ? 'Rendering Omni Flash Video...'
                  : vidPhotoBase64
                  ? `Animate Photo (${vidAspect})`
                  : `Generate Video (${vidAspect})`}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-80">
            {generatedVidUrl ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <video
                  src={generatedVidUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-96 rounded-xl border border-neutral-800"
                />
                <a
                  href={generatedVidUrl}
                  download={`kara_video_${Date.now()}.mp4`}
                  className="px-4 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            ) : (
              <div className="text-center max-w-xs space-y-2">
                <Film className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-sm font-medium text-neutral-300">Ready for Video Synthesis</p>
                <p className="text-xs text-neutral-500">
                  Select 16:9 landscape or 9:16 portrait and describe your scene or upload a photo to animate.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LYRIA MUSIC GENERATION */}
      {activeTab === 'music' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <form
            onSubmit={handleGenerateMusic}
            className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">Lyria 3 Music Composer</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Compose 30-second clips or full-length musical tracks with vocals and instrumentation.
                </p>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">Lyria Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMusicModel('lyria-3-clip-preview')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      musicModel === 'lyria-3-clip-preview'
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Lyria 3 Clip (30s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMusicModel('lyria-3-pro-preview')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      musicModel === 'lyria-3-pro-preview'
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Lyria 3 Pro (Full)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">Musical Prompt</label>
                <textarea
                  rows={4}
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  placeholder="e.g., Atmospheric synthwave track with warm analog bass, crisp drums, and dreamy nocturnal melodies..."
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {musicError && <p className="text-xs text-rose-400">{musicError}</p>}

            <button
              type="submit"
              disabled={musicLoading || !musicPrompt.trim()}
              className="w-full py-2.5 px-4 text-xs font-medium bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Music className="w-4 h-4" />
              <span>{musicLoading ? 'Composing Track...' : 'Compose Music Track'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-80">
            {musicAudioUrl ? (
              <div className="w-full space-y-4">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <p className="text-xs text-neutral-400 mb-2">Generated Audio Stream</p>
                  <audio src={musicAudioUrl} controls className="w-full" />
                </div>
                {musicLyrics && (
                  <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 max-h-56 overflow-y-auto">
                    <p className="text-xs font-semibold text-neutral-300 mb-1">
                      Lyrics & Musical Notes
                    </p>
                    <p className="text-xs text-neutral-400 whitespace-pre-wrap leading-relaxed">
                      {musicLyrics}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center max-w-xs space-y-2">
                <Music className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-sm font-medium text-neutral-300">No Track Composed Yet</p>
                <p className="text-xs text-neutral-500">
                  Select Lyria 3 Clip or Lyria 3 Pro and describe the genre, tempo, and mood.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DEEP IMAGE & VIDEO ANALYSIS (gemini-4-argon High Thinking) */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <form
            onSubmit={handleAnalyzeMedia}
            className="lg:col-span-5 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Deep Image & Video Understanding
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Powered by gemini-4-argon with ThinkingLevel.HIGH for deep visual and video analysis.
                </p>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Upload Photo or Video
                </label>
                <label className="flex items-center justify-between px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer hover:border-neutral-700 text-xs text-neutral-300">
                  <span className="truncate">
                    {analyzeFileName || 'Choose image or video file...'}
                  </span>
                  <Upload className="w-4 h-4 shrink-0 ml-2 text-sky-400" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleFileToBase64(f, (b64, mime, name) => {
                          setAnalyzeBase64(b64);
                          setAnalyzeMime(mime);
                          setAnalyzeFileName(name);
                        });
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">
                  Analysis Question / Focus
                </label>
                <textarea
                  rows={3}
                  value={analyzePrompt}
                  onChange={(e) => setAnalyzePrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {analyzeError && <p className="text-xs text-rose-400">{analyzeError}</p>}

            <button
              type="submit"
              disabled={analyzeLoading || !analyzeBase64}
              className="w-full py-2.5 px-4 text-xs font-medium bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <ScanSearch className="w-4 h-4" />
              <span>
                {analyzeLoading ? 'Analyzing with Gemini 4 Argon...' : 'Run Deep Media Analysis'}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#0F131C] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between min-h-80">
            {analysisResult ? (
              <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
                <div className="flex items-center gap-2 text-xs text-sky-400">
                  <span>Gemini 4 Argon</span>
                  <span aria-hidden="true">·</span>
                  <span>High Thinking Analysis</span>
                </div>
                <div className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {analysisResult}
                </div>
              </div>
            ) : (
              <div className="m-auto text-center max-w-xs space-y-2">
                <ScanSearch className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-sm font-medium text-neutral-300">Upload Photo or Video</p>
                <p className="text-xs text-neutral-500">
                  Gemini 4 Argon will inspect visual details, temporal events, text, and context with high-reasoning depth.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
