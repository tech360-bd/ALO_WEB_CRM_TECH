#!/bin/bash
# ALO Education - Video Ecosystem Clone Script
# Clones all 34 requested repos into external/video-repos/
# These are NOT committed to git (gitignored), only for local reference
# Date: 2026-09-14

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo "=== ALO Video Ecosystem - Cloning 34 repos ==="
echo "Base dir: $BASE_DIR"
echo ""

repos=(
  "https://github.com/n8n-io/n8n.git"
  "https://github.com/WEIFENG2333/VideoCaptioner.git"
  "https://github.com/ATH-MaaS/Pixelle-Video.git"
  "https://github.com/remotion-dev/remotion.git"
  "https://github.com/MarkTechStation/VideoCode.git"
  "https://github.com/3b1b/videos.git"
  "https://github.com/ytdl-org/youtube-dl.git"
  "https://github.com/bradautomates/claude-video.git"
  "https://github.com/MeiGen-AI/InfiniteTalk.git"
  "https://github.com/qdrzwd/VideoRecorder.git"
  "https://github.com/zai-org/CogVideo.git"
  "https://github.com/Tencent-Hunyuan/HunyuanVideo.git"
  "https://github.com/elebumm/RedditVideoMakerBot.git"
  "https://github.com/Lightricks/LTX-Video.git"
  "https://github.com/YaoFANGUK/video-subtitle-remover.git"
  "https://github.com/leandromoreira/digital_video_introduction.git"
  "https://github.com/OpenTalker/video-retalking.git"
  "https://github.com/meituan-longcat/LongCat-Video.git"
  "https://github.com/0voice/audio_video_streaming.git"
  "https://github.com/HITsz-TMG/VideoClaw.git"
  "https://github.com/jitsi/jitsi-videobridge.git"
  "https://github.com/HKUDS/VideoAgent.git"
  "https://github.com/LoSealL/VideoSuperResolution.git"
  "https://github.com/Augani/openreel-video.git"
  "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git"
  "https://github.com/dunossauro/videomaker-helper.git"
  "https://github.com/burhankocabiyik/videomaker.git"
  "https://github.com/wtz2017/VideoMaker.git"
  "https://github.com/viniciusenari/slideshow-videomaker.git"
  "https://github.com/WuTao-CS/VideoMaker.git"
  "https://github.com/shubhamdevhouse/Animated-VideoMaker.git"
  "https://github.com/seed0001/videoMaker.git"
  "https://github.com/Bilal-Belli/videoMakerBOT.git"
  "https://github.com/Nncstudio/VideoMakerPro.git"
)

# Remove duplicates
unique_repos=$(printf "%s\n" "${repos[@]}" | sort -u)

count=0
for repo in $unique_repos; do
  count=$((count+1))
  name=$(basename "$repo" .git)
  # Handle duplicate names
  if [ -d "$name" ]; then
    echo "[$count/${#repos[@]}] $name already exists, skipping"
  else
    echo "[$count/${#repos[@]}] Cloning $repo -> $name"
    git clone --depth 1 "$repo" "$name" || echo "Failed to clone $repo"
  fi
done

echo ""
echo "=== Done ==="
echo "Cloned $(ls -1d */ 2>/dev/null | wc -l) repos into $BASE_DIR"
echo ""
echo "Registry: src/lib/video-engine/registry.ts"
echo "Audit: docs/VIDEO_ECOSYSTEM_AUDIT.md"
echo ""
echo "Next steps:"
echo "1. Check docs/VIDEO_ECOSYSTEM_AUDIT.md for integration plan"
echo "2. Install optional deps: npm install remotion @remotion/cli youtube-dl-exec"
echo "3. For AI providers, setup ComfyUI: git clone https://github.com/comfyanonymous/ComfyUI && cd ComfyUI && pip install -r requirements.txt"
echo "4. For Python tools (Manim, VideoCaptioner, etc): pip install manim whisper openai"
