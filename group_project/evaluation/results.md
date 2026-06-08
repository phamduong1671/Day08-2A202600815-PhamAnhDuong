# RAG Evaluation Results

## Framework sử dụng

- **Framework:** DeepEval `4.0.5`
- **Judge model:** OpenAI `gpt-4o-mini`
- **Pipeline đánh giá:** `src.task10.generate_with_citation` (retrieval Weaviate hybrid + generation `gpt-4o-mini`)
- **Golden dataset:** 2 câu chấm thành công (giới hạn EVAL_LIMIT=2)
- **Evaluation mode:** Smoke test sample
- **Threshold pass:** 0.7 · **Thời gian chạy:** 3.6 phút


---

## Overall Scores (A/B)

| Metric | Config A (hybrid + rerank) | Config B (no rerank) | Δ (A − B) |
|--------|---------------------------|----------------------|-----------|
| Faithfulness | 1.000 | 1.000 | 0.000 |
| Answer Relevancy | 1.000 | 1.000 | 0.000 |
| Context Recall | 1.000 | 1.000 | 0.000 |
| Context Precision | 1.000 | 1.000 | 0.000 |
| **Average** | **1.000** | **1.000** | **0.000** |

---

## A/B Comparison Analysis

**Config A — Hybrid + Rerank:** semantic (bge-m3) + BM25 hợp nhất bằng RRF, sau đó cross-encoder `bge-reranker-v2-m3` chấm lại top kết quả.


**Config B — Hybrid, no Rerank:** giống A nhưng bỏ bước cross-encoder; lấy trực tiếp thứ hạng sau RRF; không dùng threshold fallback theo score vì RRF score có thang đo khác cross-encoder.


**Kết luận:** Config tốt hơn theo điểm trung bình là **ngang nhau** (Δ average = 0.000). Reranking thường nâng Context Precision rõ nhất vì nó đẩy chunk liên quan lên đầu; nếu Δ nhỏ, retrieval gốc đã đủ tốt cho corpus pháp luật có cấu trúc rõ.


---

## Worst Performers (Bottom 3 — Config A)

| # | ID | Question | Faith | Relev | Recall | Prec | Avg |
|---|----|----------|-------|-------|--------|------|-----|
| 1 | GD-001 | Tội tàng trữ trái phép chất ma túy được quy định tại điều nào của Bộ l | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| 2 | GD-002 | Khung hình phạt thấp nhất đối với tội tàng trữ trái phép chất ma túy l | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |

**Phân tích:** không có case dưới threshold trong sample hiện tại. Kết quả này chỉ xác nhận smoke test 2 Q&A chạy được; chưa thay thế full evaluation.


---

## Recommendations


### Cải tiến 1: Chốt ground truth cho các câu có `note`
**Action:** Chốt ground truth cho các câu có `note`  
**Expected impact:** Đối chiếu khối lượng/khung hình phạt với văn bản gốc trong corpus, bỏ ghi chú. → Context Recall & Faithfulness tăng vì judge so với đáp án chính xác.  

### Cải tiến 2: Bổ sung Q&A cho mảng tin tức (news/)
**Action:** Bổ sung Q&A cho mảng tin tức (news/)  
**Expected impact:** 48 câu hiện tại 100% là pháp luật; 20 bài báo nghệ sĩ chưa được đánh giá. → Phủ kín pipeline, lộ điểm yếu retrieval trên văn bản phi cấu trúc.  

### Cải tiến 3: Tăng top_k retrieval cho câu cross-reference
**Action:** Tăng top_k retrieval cho câu cross-reference  
**Expected impact:** Các câu tổng hợp nhiều điều luật cần nhiều evidence hơn (top_k 5 → 8). → Context Recall tăng cho nhóm câu hard.  


---

## Appendix — Per-question scores (Config A)

| ID | Doc | Diff | Faith | Relev | Recall | Prec |
|----|-----|------|-------|-------|--------|------|
| GD-001 | bo-luat-hinh-su-2017 | easy | 1.000 | 1.000 | 1.000 | 1.000 |
| GD-002 | bo-luat-hinh-su-2017 | easy | 1.000 | 1.000 | 1.000 | 1.000 |
