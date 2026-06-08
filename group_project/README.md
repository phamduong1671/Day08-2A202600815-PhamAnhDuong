# Group Project — Full RAG Pipeline + Evaluation

## Mục Tiêu Hiện Tại

Build đầy đủ RAG pipeline cho chatbot hỏi đáp về pháp luật ma túy và tin tức liên quan, kèm evaluation pipeline. Trong giai đoạn chờ golden dataset mới, evaluation mặc định chạy sample 2 Q&A đầu tiên để smoke test toàn bộ pipeline.

---

## Kiến Trúc

```text
data/landing
  -> data/standardized
  -> Task 4 chunking + embedding + Weaviate index
  -> Task 5 semantic search
  -> Task 6 BM25 lexical search
  -> Task 9 RRF merge + optional rerank + PageIndex fallback
  -> Task 10 generation có citation
  -> app.py Streamlit chatbot + conversation memory + source display

group_project/evaluation/golden_dataset.json
  -> eval_pipeline.py
  -> DeepEval metrics
  -> A/B: hybrid+rerank vs hybrid no-rerank
  -> results.md
```

---

## Option 1 — RAG Chatbot

- [x] Giao diện Streamlit
- [x] Chat UI bằng `st.chat_message` và `st.chat_input`
- [x] Trả lời bằng full RAG pipeline `src.task10_generation.generate_with_citation`
- [x] Citation trong câu trả lời theo prompt Task 10
- [x] Conversation memory cho follow-up questions
- [x] Hiển thị source documents đã dùng cho từng câu trả lời
- [x] Lưu source documents trong `st.session_state` để rerun vẫn thấy nguồn cũ
- [x] Cho phép bật/tắt cross-encoder reranking trong UI
- [x] Cho phép chỉnh số source chunks `top_k`

Entrypoint:

```bash
streamlit run app.py
```

---

## Option 2 — RAG Evaluation Pipeline

- [x] Framework: DeepEval
- [x] Golden dataset file: `group_project/evaluation/golden_dataset.json`
- [x] Dataset hiện tại: 48 câu Q&A
- [x] Smoke test mặc định: 2 câu đầu trong dataset
- [x] Metrics: Faithfulness, Answer Relevancy, Contextual Recall, Contextual Precision
- [x] A/B comparison: hybrid + rerank vs hybrid no-rerank
- [x] Report file: `group_project/evaluation/results.md`
- [x] A/B no-rerank không bị PageIndex fallback làm lệch kết quả RRF
- [x] Evaluation load `.env` trước khi tạo DeepEval judge/model client
- [x] Sample 2 Q&A đã chạy và ghi report
- [ ] Full evaluation: chạy sau khi golden dataset mới/chốt đáp án được cập nhật

Chạy smoke test mặc định 2 câu:

```bash
python -m group_project.evaluation.eval_pipeline
```

Chạy N câu:

```bash
EVAL_LIMIT=8 python -m group_project.evaluation.eval_pipeline
```

Chạy toàn bộ dataset:

```bash
EVAL_LIMIT=0 python -m group_project.evaluation.eval_pipeline
```

---

## Pipeline Components

- [x] Data landing legal/news
- [x] Markdown standardized corpus
- [x] Chunking: recursive splitter, `chunk_size=900`, `chunk_overlap=120`
- [x] Embedding: `BAAI/bge-m3`, 1024 dimensions
- [x] Vector store: Weaviate collection `DrugLawDocs`
- [x] Dense retrieval: semantic search
- [x] Sparse retrieval: BM25 + PyVi tokenization
- [x] Fusion: Reciprocal Rank Fusion
- [x] Reranking: `BAAI/bge-reranker-v2-m3`
- [x] Fallback: PageIndex vectorless retrieval
- [x] Generation: OpenAI-compatible chat completion with citation prompt
- [x] Evaluation: DeepEval 4 metrics + A/B configs

---

## Cách Chạy

### 1. Cài dependencies

```bash
pip install -r requirements.txt
```

### 2. Cấu hình môi trường

Tạo `.env` từ `.env.example`, tối thiểu cần:

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
LLM_MODEL=...

WEAVIATE_URL=...
WEAVIATE_API_KEY=...
WEAVIATE_COLLECTION=DrugLawDocs
```

Nếu dùng Ollama local, `OPENAI_BASE_URL` có thể trỏ về:

```bash
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
LLM_MODEL=qwen2.5:7b-instruct
```

### 3. Build/rebuild index khi data thay đổi

```bash
python -m src.task4_chunking_indexing
```

### 4. Chạy chatbot

```bash
streamlit run app.py
```

### 5. Chạy evaluation

```bash
python -m group_project.evaluation.eval_pipeline
```

---

## Việc Còn Lại Khi Có Golden Dataset Mới

- [ ] Thay/cập nhật `group_project/evaluation/golden_dataset.json`
- [ ] Chốt `expected_answer` và `expected_context`, bỏ các field `note` nếu không còn cần
- [ ] Chạy `EVAL_LIMIT=0 python -m group_project.evaluation.eval_pipeline`
- [ ] Review `results.md`: bảng A/B, worst performers, recommendations
- [ ] Nếu dataset có nhiều câu news, kiểm tra retrieval trên `data/standardized/news`

---

## Checklist Hoàn Thiện Theo Yêu Cầu

### Sản Phẩm RAG Chatbot

- [x] Có giao diện chat Streamlit
- [x] Có full RAG flow: retrieval -> generation -> answer
- [x] Câu trả lời yêu cầu citation theo source trong prompt
- [x] Có conversation memory cho follow-up
- [x] Có source display cho từng assistant response
- [x] Có control `top_k`
- [x] Có control bật/tắt reranking
- [x] Có xử lý lỗi pipeline để demo không crash UI

### RAG Evaluation Pipeline

- [x] Có `group_project/evaluation/golden_dataset.json`
- [x] Golden dataset hiện tại có 48 Q&A, vượt yêu cầu tối thiểu 15
- [x] Có `group_project/evaluation/eval_pipeline.py`
- [x] Có DeepEval judge/model setup
- [x] Có Faithfulness metric
- [x] Có Answer Relevancy metric
- [x] Có Contextual Recall metric
- [x] Có Contextual Precision metric
- [x] Có A/B config 1: hybrid + rerank
- [x] Có A/B config 2: hybrid no-rerank
- [x] No-rerank config dùng RRF trực tiếp, không bị fallback threshold sai thang điểm
- [x] Có `group_project/evaluation/results.md`
- [x] Có bảng điểm A/B cho sample 2 Q&A
- [x] Có phân tích worst performers hoặc ghi rõ không có case dưới threshold
- [x] Có recommendations
- [x] Có cách chạy sample 2 Q&A mặc định
- [x] Có cách chạy full dataset bằng `EVAL_LIMIT=0`

### Yêu Cầu Chung

- [x] Tích hợp pipeline từ các task cá nhân vào flow chung
- [x] Demo local bằng `streamlit run app.py`
- [x] Evaluation pipeline chạy được với sample 2 Q&A
- [x] README mô tả kiến trúc
- [x] README mô tả cách chạy
- [x] README có checklist trạng thái
- [ ] Cập nhật phân công thật của thành viên nhóm
- [ ] Push/commit lên repository chung

---

## Phân Công Công Việc

| Thành viên | MSSV | Nhiệm vụ | Trạng thái |
|-----------|------|----------|------------|
| TBD | TBD | Data + standardized corpus | Done |
| TBD | TBD | Retrieval pipeline | Done |
| TBD | TBD | RAG chatbot UI | Done |
| TBD | TBD | Evaluation sample 2 Q&A + report | Done |
