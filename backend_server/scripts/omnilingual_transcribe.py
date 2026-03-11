#!/usr/bin/env python3
"""
Omnilingual ASR 转录脚本：接收音频文件路径，输出识别文本（单行）。
供 Node.js server.js 在 VOICE_ENGINE=omnilingual_asr 时调用。

依赖：
  pip install omnilingual-asr pydub
  brew install libsndfile ffmpeg   # Mac
  # 或系统安装 ffmpeg + libsndfile

用法：
  python omnilingual_transcribe.py /path/to/audio.m4a [lang]
  lang 默认 cmn_Hans（普通话），可选 eng_Latn 等，见 https://github.com/facebookresearch/omnilingual-asr
"""
import os
import sys
import tempfile

def main():
    if len(sys.argv) < 2:
        print("", end="")
        sys.exit(1)
    audio_path = os.path.abspath(sys.argv[1])
    lang = sys.argv[2] if len(sys.argv) > 2 else "cmn_Hans"

    if not os.path.isfile(audio_path):
        print("", end="")
        sys.exit(2)

    work_path = audio_path
    need_cleanup = False
    if audio_path.lower().endswith(".m4a"):
        try:
            from pydub import AudioSegment
            seg = AudioSegment.from_file(audio_path, format="m4a")
            fd, work_path = tempfile.mkstemp(suffix=".wav")
            os.close(fd)
            seg.export(work_path, format="wav")
            need_cleanup = True
        except Exception as e:
            sys.stderr.write(f"m4a->wav failed: {e}\n")
            print("", end="")
            sys.exit(3)

    try:
        from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline
    except ImportError:
        sys.stderr.write("omnilingual-asr not installed. Run: pip install omnilingual-asr\n")
        print("", end="")
        sys.exit(4)

    # 0.1.0 仅支持无 _v2 的模型名；0.2.0 支持 omniASR_LLM_300M_v2 等
    model_card = os.environ.get("OMNILINGUAL_ASR_MODEL", "omniASR_LLM_300M")
    try:
        pipeline = ASRInferencePipeline(model_card=model_card)
        transcriptions = pipeline.transcribe([work_path], lang=[lang], batch_size=1)
        text = (transcriptions[0] or "").strip()
        print(text, end="")
    except Exception as e:
        sys.stderr.write(f"transcribe error: {e}\n")
        print("", end="")
        sys.exit(5)
    finally:
        if need_cleanup and os.path.isfile(work_path):
            try:
                os.unlink(work_path)
            except Exception:
                pass

if __name__ == "__main__":
    main()
