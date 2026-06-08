const chat = document.querySelector("#chat");
const sources = document.querySelector("#sources");
const form = document.querySelector("#chatForm");
const questionInput = document.querySelector("#question");
const sendButton = document.querySelector("#sendButton");
const template = document.querySelector("#messageTemplate");
const topK = document.querySelector("#topK");
const topKValue = document.querySelector("#topKValue");
const threshold = document.querySelector("#threshold");
const thresholdValue = document.querySelector("#thresholdValue");
const charCount = document.querySelector("#charCount");
const clearChat = document.querySelector("#clearChat");

const demoSources = [
  {
    content:
      "Luật Phòng, chống ma túy 2021 quy định trách nhiệm phòng, chống ma túy, quản lý người sử dụng trái phép chất ma túy và cai nghiện ma túy.",
    score: 0.921,
    source: "hybrid",
    metadata: {
      source: "Luật Phòng, chống ma túy 2021",
      source_path: "data/standardized/legal/luat-phong-chong-ma-tuy-2021.md",
      type: "legal",
    },
  },
  {
    content:
      "Bộ luật Hình sự 2015, sửa đổi bổ sung 2017, Chương XX quy định các tội phạm về ma túy, trong đó có tội tàng trữ trái phép chất ma túy.",
    score: 0.896,
    source: "hybrid",
    metadata: {
      source: "Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)",
      source_path: "data/standardized/legal/bo-luat-hinh-su-2017.md",
      type: "legal",
    },
  },
  {
    content:
      "Nghị định 105/2021/NĐ-CP hướng dẫn thi hành một số điều của Luật Phòng, chống ma túy.",
    score: 0.742,
    source: "hybrid",
    metadata: {
      source: "Nghị định 105/2021/NĐ-CP",
      source_path: "data/standardized/legal/nghi-dinh-105-2021.md",
      type: "legal",
    },
  },
];

const initialMessages = [
  {
    role: "user",
    content: "Tôi tàng trữ trái phép chất ma túy bị xử lý như thế nào?",
  },
  {
    role: "assistant",
    content:
      "Tội tàng trữ trái phép chất ma túy được quy định tại Điều 249 Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017). Người phạm tội có thể bị phạt tù từ 01 năm đến chung thân tùy theo khối lượng và tính chất của chất ma túy. Ngoài ra, còn có thể bị phạt tiền từ 5 triệu đồng đến 500 triệu đồng, phạt bổ sung và các hình phạt khác theo quy định của pháp luật.\n\nCụ thể về hành vi tàng trữ trái phép chất ma túy được hiểu là việc cất giữ, giấu, cất giữ hoặc để dành trái phép chất ma túy dưới bất kỳ hình thức nào. [Luật Phòng, chống ma túy 2021]",
    sources: demoSources,
    retrieval_source: "hybrid",
  },
];

let messages = loadMessages();
let latestSources = getLatestSources(messages);

function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem("rag-chat-messages") || "[]");
    return saved.length ? saved : initialMessages;
  } catch {
    return initialMessages;
  }
}

function saveMessages() {
  localStorage.setItem("rag-chat-messages", JSON.stringify(messages));
}

function getLatestSources(items) {
  const lastWithSources = [...items].reverse().find((item) => item.sources?.length);
  return lastWithSources?.sources || demoSources;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCitations(text) {
  return escapeHtml(text).replace(/(\[[^\[\]]{2,120}\])/g, '<span class="citation">$1</span>');
}

function currentTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessage(message) {
  const node = template.content.firstElementChild.cloneNode(true);
  node.classList.add(message.role);
  node.querySelector(".content").innerHTML =
    message.role === "assistant" ? renderCitations(message.content) : escapeHtml(message.content);
  node.querySelector(".time").textContent = message.time || "10:15";
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
}

function shortDescription(source) {
  const metadata = source.metadata || {};
  const content = String(source.content || "");
  if (metadata.type === "news") return content.slice(0, 86) || "Bài viết tin tức liên quan";
  return content.slice(0, 86) || "Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam";
}

function articleLabel(source) {
  const path = source.metadata?.source_path || "";
  const match = path.match(/dieu[-_\s]*(\d+)/i);
  if (match) return `Điều ${match[1]}`;
  const title = source.metadata?.source || "";
  if (title.includes("Hình sự")) return "Điều 249";
  if (title.includes("Nghị định")) return "Điều 2";
  return "Điều 3";
}

function renderSources(items) {
  const cards = (items.length ? items : demoSources).slice(0, 3);
  sources.innerHTML = cards
    .map((source) => {
      const metadata = source.metadata || {};
      const title = metadata.source || metadata.title || "Source document";
      const score = Number(source.score || 0).toFixed(3);
      return `
        <article class="source-card">
          <div class="pdf-icon">PDF</div>
          <div>
            <div class="source-title">${escapeHtml(title)}</div>
            <div class="source-desc">${escapeHtml(shortDescription(source))}</div>
          </div>
          <div class="source-footer">
            <span class="score-pill">score ${score}</span>
            <span class="article-link">${escapeHtml(articleLabel(source))} ↗</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAll() {
  chat.innerHTML = "";
  messages.forEach(renderMessage);
  latestSources = getLatestSources(messages);
  renderSources(latestSources);
}

async function ask(question) {
  const userMessage = { role: "user", content: question, time: currentTime() };
  messages.push(userMessage);
  saveMessages();
  renderMessage(userMessage);

  sendButton.disabled = true;
  questionInput.disabled = true;

  const loading = {
    role: "assistant",
    content: "Đang truy xuất tài liệu bằng hybrid retrieval và sinh câu trả lời có citation...",
    time: currentTime(),
  };
  renderMessage(loading);
  const loadingNode = chat.lastElementChild;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        history: messages.slice(-8),
        top_k: Number(topK.value),
      }),
    });
    const result = await response.json();
    const assistantMessage = {
      role: "assistant",
      content: result.answer,
      sources: result.sources || [],
      retrieval_source: result.retrieval_source || "hybrid",
      time: currentTime(),
    };
    messages.push(assistantMessage);
    latestSources = assistantMessage.sources.length ? assistantMessage.sources : latestSources;
    saveMessages();
    loadingNode.remove();
    renderMessage(assistantMessage);
    renderSources(latestSources);
  } catch (error) {
    const assistantMessage = {
      role: "assistant",
      content: `Chưa kết nối được backend HTML. Chi tiết: ${error.message}`,
      sources: [],
      retrieval_source: "error",
      time: currentTime(),
    };
    messages.push(assistantMessage);
    saveMessages();
    loadingNode.remove();
    renderMessage(assistantMessage);
  } finally {
    sendButton.disabled = false;
    questionInput.disabled = false;
    questionInput.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;
  questionInput.value = "";
  charCount.textContent = "0/2000";
  ask(question);
});

questionInput.addEventListener("input", () => {
  charCount.textContent = `${questionInput.value.length}/2000`;
});

topK.addEventListener("input", () => {
  topKValue.textContent = topK.value;
});

threshold.addEventListener("input", () => {
  thresholdValue.textContent = Number(threshold.value).toFixed(2);
});

clearChat.addEventListener("click", () => {
  messages = initialMessages;
  latestSources = demoSources;
  saveMessages();
  renderAll();
});

renderAll();
