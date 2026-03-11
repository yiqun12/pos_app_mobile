# Omnilingual ASR 语音识别（可选）

[Omnilingual ASR](https://github.com/facebookresearch/omnilingual-asr) 是 Meta 开源的 1600+ 语言语音识别模型，可在本机运行、无需调用云端 API。

## 启用方式

在 `backend_server/.env` 中设置：

```env
VOICE_ENGINE=omnilingual_asr
```

可选环境变量：

- `OMNILINGUAL_ASR_MODEL`：模型名称，默认 `omniASR_LLM_300M_v2`。可改为 `omniASR_LLM_1B_v2`、`omniASR_LLM_7B_v2` 等（越大越准但越吃显存/内存）。
- `OMNILINGUAL_ASR_LANG`：语言代码，默认 `cmn_Hans`（普通话）。例如 `eng_Latn` 英语。
- `PYTHON_PATH`：Python 解释器路径，默认 `python3`。

## 环境要求

1. **必须使用 Python 3.10、3.11 或 3.12**  
   - 不支持 3.9 及以下，也不支持 3.13 及以上。  
   - 依赖 **fairseq2n** 只有针对 3.10～3.12 的预编译包，用 3.13 会报 “fairseq2n has no matching distributions” 或 “Cannot install fairseq2” 的依赖冲突。
2. **系统依赖**（用于音频读取）：
   - Mac: `brew install libsndfile ffmpeg`
   - Ubuntu: `sudo apt install libsndfile1 ffmpeg`
3. **Python 包**（务必在 3.10～3.12 的虚拟环境里装）：

```bash
# 示例：用 Python 3.12 建虚拟环境（本机需已安装 3.12）
python3.12 -m venv venv-omni
source venv-omni/bin/activate   # Windows: venv-omni\Scripts\activate
pip install -r backend_server/scripts/requirements-omnilingual.txt
```

首次运行会自动下载模型（约 1.3 GB 起），保存到 `~/.cache/fairseq2/assets/`。

## 安装报错时

- **“fairseq2n has no matching distributions” / “Cannot install fairseq2”**  
  说明当前 Python 版本或平台没有 fairseq2n 的 wheel（常见于 **Python 3.13**）。  
  **处理**：用 **3.10、3.11 或 3.12** 建一个单独 venv，只在这个 venv 里装 omnilingual 依赖；Node 里通过 `PYTHON_PATH` 指向该 venv 的 `python` 即可。
- **没有 python3.12**  
  - Mac: `brew install python@3.12`，然后用 `python3.12 -m venv venv-omni`  
  - 或用 [pyenv](https://github.com/pyenv/pyenv): `pyenv install 3.12 && pyenv local 3.12` 后再建 venv

## 资源参考

- 300M 模型：约 2 GiB 显存/内存，适合试跑。
- 7B 模型：约 17 GiB 显存，需较强 GPU。
- 官方说明：单段音频建议 ≤ 40 秒（非 Unlimited 模型）；更长可选用 `omniASR_LLM_Unlimited_300M_v2` 等。
