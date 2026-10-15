# 视频处理工具集

一个基于 Python 的视频处理工具集，提供转码、剪辑、字幕提取等功能。

## 功能特性

- 🎬 视频转码（H.264/H.265/VP9）
- ✂️ 视频剪辑与合并
- 📝 字幕提取与生成
- 🎵 音频分离与处理
- 📊 视频信息分析

## 安装

```bash
pip install -r requirements.txt
```

## 使用方法

### 转码

```python
from video_toolkit import transcode

transcode("input.mp4", "output.mp4", codec="h265")
```

### 剪辑

```python
from video_toolkit import cut

cut("input.mp4", "output.mp4", start="00:01:00", end="00:02:30")
```

### 字幕提取

```python
from video_toolkit import extract_subtitle

extract_subtitle("input.mp4", "output.srt")
```

## 配置

项目支持通过 `.env` 文件自定义配置：

```env
# 视频处理临时目录
TEMP_DIR=/tmp/video_processing

# 输出质量（low/medium/high）
OUTPUT_QUALITY=high

# 并发处理数
MAX_WORKERS=4
```

## 许可证

MIT
