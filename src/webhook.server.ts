// src/webhook.server.ts
import { Bot, webhookCallback } from "grammy";
import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

// Конфигурация: берем токены из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN; // основной бот (LawSense)
const MED_BOT_TOKEN = process.env.MED_BOT_TOKEN; // медицинский бот (Densa) — опционально
const PORT = Number(process.env.PORT ?? 3000);

// Валидация токена (останавливаем процесс, если токен не задан)
if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
  console.error(
    "⚠️ Не установлен BOT_TOKEN. Установите переменную окружения BOT_TOKEN.",
  );
  process.exit(1);
}

// Создание ботов уже после валидации токенов
const lawBot = new Bot(BOT_TOKEN);
const medBot = new Bot(MED_BOT_TOKEN ?? BOT_TOKEN); // для демо можно использовать тот же токен

// Настройка Hono приложения
const app = new Hono();

app.use("*", logger());
app.use("*", cors());

// Обработчики для юридического бота
lawBot.command("start", async (ctx) => {
  const username = ctx.from?.username || "Пользователь";
  await ctx.reply(
    `Привет, @${username}!\n\n` +
      `Это LawSense - юридический помощник.\n\n` +
      `Доступные команды:\n` +
      `/help - помощь\n` +
      `/article [номер] - найти статью\n` +
      `/ask [вопрос] - задать юридический вопрос\n` +
      `/stats - статистика`,
    { parse_mode: "HTML" },
  );
});

lawBot.command("help", async (ctx) => {
  await ctx.reply(
    `Помощь по LawSense:\n\n` +
      `Основные команды:\n` +
      `/start - начать работу\n` +
      `/article 116 - найти статью 116\n` +
      `/ask - задать юридический вопрос\n` +
      `/stats - посмотреть статистику\n\n` +
      `Примеры вопросов:\n` +
      `• "Что делать при нарушении ПДД?"\n` +
      `• "Как подать в суд?"\n` +
      `• "Права потребителя"`,
    { parse_mode: "HTML" },
  );
});

lawBot.command("article", async (ctx) => {
  const articleNumber = ctx.match;

  if (!articleNumber) {
    await ctx.reply("Укажите номер статьи. Например: /article 116");
    return;
  }

  await ctx.reply(
    `Статья ${articleNumber}\n\n` +
      `Ищу статью ${articleNumber} в базе данных...\n\n` +
      `В демо-версии показывается заглушка.`,
    { parse_mode: "HTML" },
  );
});

lawBot.command("ask", async (ctx) => {
  const question = ctx.match;

  if (!question) {
    await ctx.reply("Задайте ваш вопрос. Например: /ask Что делать при ДТП?");
    return;
  }

  await ctx.reply("Обрабатываю ваш вопрос...");

  // Явно указали тип массива, чтобы избежать `string | undefined`
  const responses: string[] = [
    `По вашему вопросу "${question}":\n\nРекомендую обратиться к статьям 115-118 КоАП РК.\nДля точной консультации свяжитесь с юристом.\n\n(Демо-ответ.)`,
    `Анализ вопроса: "${question}"\n\nНайдены релевантные статьи в базе.\nВ продакшене здесь будет развернутый ответ с ссылками.`,
  ];

  setTimeout(async () => {
    const idx = Math.floor(Math.random() * responses.length);
    const randomResponse = responses[idx];

    // Защита на случай неожиданной пустоты массива
    if (typeof randomResponse !== "string") {
      // fallback-ответ на всякий случай
      await ctx.reply("Произошла внутренняя ошибка: отсутствует ответ.", {
        parse_mode: "HTML",
      });
      return;
    }

    await ctx.reply(randomResponse, { parse_mode: "HTML" });
  }, 2000);
});

lawBot.command("stats", async (ctx) => {
  const userId = ctx.from?.id ?? "unknown";
  await ctx.reply(
    `Статистика пользователя\n\n` +
      `ID: <code>${userId}</code>\n` +
      `Запросов сегодня: 5\n` +
      `Всего запросов: 23\n` +
      `Подписка: Базовая\n\n` +
      `В реальной версии данные берутся из PostgreSQL`,
    { parse_mode: "HTML" },
  );
});

lawBot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const username = ctx.from?.username || "Пользователь";

  console.log(`[LAW] Сообщение от @${username}: ${text}`);

  const lowered = text.toLowerCase();
  if (lowered.includes("пдд") || lowered.includes("дтп")) {
    await ctx.reply(
      `Вопрос по ПДД/ДТП:\n\n` +
        `Рекомендую изучить статьи 115-118 КоАП РК.\n` +
        `При серьезных нарушениях обращайтесь к юристу.`,
      { parse_mode: "HTML" },
    );
  } else if (lowered.includes("суд") || lowered.includes("иск")) {
    await ctx.reply(
      `Судебные вопросы:\n\n` +
        `Для подачи иска необходимо:\n` +
        `• Составить исковое заявление\n` +
        `• Собрать доказательства\n` +
        `• Оплатить госпошлину\n\n` +
        `Рекомендуется консультация с юристом.`,
      { parse_mode: "HTML" },
    );
  } else {
    await ctx.reply(
      `Обработка вопроса: "${text}"\n\n` +
        `В реальной версии тут будет AI-анализ и ссылки на законы.\n` +
        `Используйте /help или /ask [вопрос]`,
      { parse_mode: "HTML" },
    );
  }
});

// Медицинский бот (базовый)
medBot.command("start", async (ctx) => {
  const username = ctx.from?.username || "Пользователь";
  await ctx.reply(
    `Привет, @${username}!\n\n` +
      `Densa - медицинский помощник.\n\n` +
      `Важно: информация не заменяет консультацию врача!\n\n` +
      `Доступные команды:\n` +
      `/help - помощь\n` +
      `/symptoms - описать симптомы\n` +
      `/emergency - экстренные случаи`,
    { parse_mode: "HTML" },
  );
});

medBot.on("message:text", async (ctx) => {
  const text = ctx.message.text.toLowerCase();

  if (text.includes("болит") || text.includes("боль")) {
    await ctx.reply(
      `Болевые ощущения\n\n` +
        `При сильной боли обратитесь к врачу!\n` +
        `Экстренная помощь: 103\n\n` +
        `Это не замена медицинской консультации.`,
      { parse_mode: "HTML" },
    );
  } else {
    await ctx.reply(
      `Спасибо за обращение!\n\n` +
        `Для точного диагноза и лечения обязательно обратитесь к врачу.\n` +
        `Экстренная помощь: 103`,
      { parse_mode: "HTML" },
    );
  }
});

// Webhook эндпоинты
app.post("/webhook/lawsense", webhookCallback(lawBot, "hono"));
app.post("/webhook/densa", webhookCallback(medBot, "hono"));

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    bots: {
      lawsense: "active",
      densa: "active",
    },
  });
});

// Главная страница
app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Webhook Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #333; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .status { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Webhook Server</h1>
      <p class="status">Сервер запущен и готов принимать webhook'и!</p>

      <h3>Доступные эндпоинты:</h3>
      <div class="endpoint"><b>LawSense webhook:</b> POST /webhook/lawsense</div>
      <div class="endpoint"><b>Densa webhook:</b> POST /webhook/densa</div>
      <div class="endpoint"><b>Health check:</b> GET /health</div>

      <h3>Как использовать:</h3>
      <ol>
        <li>Запустить туннель: <code>ssh -R 80:localhost:${PORT} nokey@localhost.run</code></li>
        <li>Получить публичный URL</li>
        <li>Установить webhook в Telegram боте</li>
        <li>Начать общение с ботом</li>
      </ol>

      <h3>Технологии:</h3>
      <p>TypeScript + grammY + Hono</p>
    </body>
    </html>
  `);
});

// Функция для установки webhook (использует переменную окружения WEBHOOK_URL если задана)
async function setupWebhook() {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await lawBot.api.setWebhook(`${webhookUrl}/webhook/lawsense`);
      console.log(
        `Webhook установлен для LawSense: ${webhookUrl}/webhook/lawsense`,
      );
      if (MED_BOT_TOKEN) {
        await medBot.api.setWebhook(`${webhookUrl}/webhook/densa`);
        console.log(
          `Webhook установлен для Densa: ${webhookUrl}/webhook/densa`,
        );
      }
    } catch (error) {
      console.error("Ошибка установки webhook:", error);
    }
  } else {
    console.log(
      "Установите переменную WEBHOOK_URL для автоматической настройки webhook'ов",
    );
  }
}

// Запуск сервера
async function startServer() {
  console.log("Запуск webhook сервера...");
  await setupWebhook();

  console.log(`Сервер запущен на http://localhost:${PORT}`);
  serve({
    fetch: app.fetch,
    port: PORT,
  });
}

// Обработка ошибок и graceful shutdown
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Получен SIGINT, завершаю работу...");
  process.exit(0);
});

startServer().catch(console.error);
