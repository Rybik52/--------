const express = require("express");
const WebSocket = require("ws");
const { Worker } = require("worker_threads");

const app = express();
const wss = new WebSocket.Server({ noServer: true });

// Хранение соответствия ключевых слов с URL
const keywordMap = {
	wiki: ["https://ru.wikipedia.org/wiki/", "https://en.wikipedia.org/wiki/"],
	js: ["https://learn.javascript.ru/", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
};
// Обработчик WebSocket соединений
wss.on("connection", (ws) => {
	// Обработка сообщений от клиента
	ws.on("message", (message) => {
		const data = JSON.parse(message);
		const keyword = String(data.keyword).trim().toLowerCase();
		const urls = keywordMap[keyword];

		if (urls) {
			// Отправка списка URL клиенту
			ws.send(JSON.stringify(urls));
		}
	});

	// Добавляем обработчик сообщений от клиента, относящихся к скачиванию контента
	ws.on("message", (message) => {
		const data = JSON.parse(message);
		if (data.action === "download") {
			const url = data.url;
			const threads = data.threads || 1; // Количество потоков загрузки (по умолчанию 1)

			// Создание воркеров для многопоточной загрузки контента
			for (let i = 0; i < threads; i++) {
				const worker = new Worker("./download-worker.js", {
					workerData: { url },
				});

				// Обработка сообщений от воркера
				worker.on("message", (message) => {
					ws.send(JSON.stringify(message)); // Отправка статуса загрузки клиенту
				});

				// Обработка ошибок воркера
				worker.on("error", (error) => {
					console.error(`Worker error: ${error}`);
				});
			}
		}
	});
});

// Создание HTTP сервера
const server = app.listen(3000, () => {
	console.log("Server started on port 3000");
});

// Обработчик новых WebSocket соединений
server.on("upgrade", (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit("connection", ws, request);
	});
});
