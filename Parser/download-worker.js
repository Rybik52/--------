const { workerData, parentPort } = require('worker_threads');
const axios = require('axios');

const url = workerData.url;

axios
    .get(url, { responseType: 'document', onDownloadProgress })
    .then((response) => {
        const content = response.data;
        // Отправка сообщения о завершении загрузки контента
        parentPort.postMessage({ status: 'finished', content });
        console.log('Success, status code:', response.status)
    })
    .catch((error) => {
        console.error(`Error downloading content: ${error}`);
    });

function onDownloadProgress(event) {
    // Отправка сообщения о прогрессе загрузки контента
    parentPort.postMessage({ status: 'progress', progress: event.loaded, total: event.total });
}
