document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csvFile');
    const fileNameDisplay = document.getElementById('fileName');
    const loadDefaultBtn = document.getElementById('loadDefault');
    const clearTableBtn = document.getElementById('clearTable');
    const loadImagesBtn = document.getElementById('loadImages');
    const imageInputSection = document.getElementById('imageInputSection');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const applyImagesBtn = document.getElementById('applyImages');
    const cancelImagesBtn = document.getElementById('cancelImages');
    const dataTable = document.getElementById('dataTable');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    let csvData = [];
    let imageUrls = [];
    let currentSelectedRow = null;

    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `選択されたファイル: ${file.name}`;
            loadCSVFile(file);
        }
    });

    loadDefaultBtn.addEventListener('click', function() {
        loadDefaultCSV();
    });

    clearTableBtn.addEventListener('click', function() {
        clearTable();
    });

    loadImagesBtn.addEventListener('click', function() {
        imageInputSection.style.display = 'block';
        imageUrlInput.focus();
    });

    applyImagesBtn.addEventListener('click', function() {
        const inputText = imageUrlInput.value.trim();
        if (inputText) {
            // 改行で分割して各商品の画像URL群を取得
            const lines = inputText.split('\n').map(line => line.trim()).filter(line => line);
            
            // 各行から最初の画像URLのみを抽出
            imageUrls = lines.map(line => {
                const urls = line.split(';').map(url => url.trim()).filter(url => url);
                return urls.length > 0 ? urls[0] : null;
            }).filter(url => url !== null);
            
            updateTableWithImages();
            imageInputSection.style.display = 'none';
            imageUrlInput.value = '';
            
            console.log(`${imageUrls.length}個の商品画像を追加しました`);
        } else {
            alert('画像URLを入力してください');
        }
    });

    cancelImagesBtn.addEventListener('click', function() {
        imageInputSection.style.display = 'none';
        imageUrlInput.value = '';
    });

    function showLoading() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        dataTable.style.display = 'none';
    }

    function hideLoading() {
        loadingMessage.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        dataTable.style.display = 'none';
        hideLoading();
    }

    function showTable() {
        errorMessage.style.display = 'none';
        dataTable.style.display = 'table';
        hideLoading();
    }

    function clearTable() {
        csvData = [];
        imageUrls = [];
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';
        dataTable.style.display = 'none';
        fileNameDisplay.textContent = '';
        csvFileInput.value = '';
    }

    function loadCSVFile(file) {
        showLoading();
        
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: function(results) {
                if (results.errors.length > 0) {
                    showError('CSVファイルの解析エラー: ' + results.errors[0].message);
                    return;
                }
                
                csvData = results.data;
                generateTable(csvData, false);
            },
            error: function(error) {
                showError('ファイル読み込みエラー: ' + error.message);
            }
        });
    }

    function loadDefaultCSV() {
        showLoading();
        fileNameDisplay.textContent = 'デフォルトファイル: Twitter________________.csv';
        
        fetch('./Twitter________________.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error('デフォルトCSVファイルが見つかりません');
                }
                return response.text();
            })
            .then(csvText => {
                Papa.parse(csvText, {
                    header: false,
                    skipEmptyLines: true,
                    complete: function(results) {
                        if (results.errors.length > 0) {
                            showError('デフォルトCSVファイルの解析エラー: ' + results.errors[0].message);
                            return;
                        }
                        
                        csvData = results.data;
                        generateTable(csvData, false);
                    },
                    error: function(error) {
                        showError('デフォルトCSVファイル解析エラー: ' + error.message);
                    }
                });
            })
            .catch(error => {
                showError('デフォルトCSVファイル読み込みエラー: ' + error.message);
            });
    }

    function isImageUrl(text) {
        if (!text) return false;
        const imagePattern = /https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i;
        const amazonImagePattern = /https?:\/\/m\.media-amazon\.com\/images\//i;
        return imagePattern.test(text) || amazonImagePattern.test(text);
    }

    function extractFirstImageUrl(text) {
        if (!text) return null;
        
        const urls = text.split(';');
        for (let url of urls) {
            url = url.trim();
            if (isImageUrl(url)) {
                return url;
            }
        }
        return null;
    }

    function createImageElement(url) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'product-image';
        img.alt = '商品画像';
        img.onerror = function() {
            this.style.display = 'none';
        };
        img.onclick = function(e) {
            e.stopPropagation();
            window.open(url, '_blank');
        };
        return img;
    }

    function updateTableWithImages() {
        if (!csvData || csvData.length === 0) {
            alert('先にCSVファイルを読み込んでください');
            return;
        }
        generateTable(csvData, true);
    }

    function generateTable(data, includeImages = false) {
        if (!data || data.length === 0) {
            showError('CSVデータが空です');
            return;
        }

        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';

        const headers = data[0];
        const headerRow = document.createElement('tr');
        
        if (includeImages && imageUrls.length > 0) {
            const imgTh = document.createElement('th');
            imgTh.textContent = '画像';
            headerRow.appendChild(imgTh);
        }
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        tableHeader.appendChild(headerRow);

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row.length === 0) continue;
            
            const tr = document.createElement('tr');
            
            if (includeImages && imageUrls.length > 0) {
                const imgTd = document.createElement('td');
                const imageIndex = i - 1;
                
                if (imageUrls[imageIndex]) {
                    // すでに最初のURLのみが格納されているので、そのまま使用
                    const img = createImageElement(imageUrls[imageIndex]);
                    imgTd.appendChild(img);
                }
                
                tr.appendChild(imgTd);
            }
            
            row.forEach((cell, cellIndex) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.setAttribute('data-keyword', cell);
                td.setAttribute('data-row', i);
                td.setAttribute('data-col', cellIndex);
                
                td.addEventListener('click', function() {
                    searchYahooRealtime(cell);
                });
                
                tr.appendChild(td);
            });
            
            tableBody.appendChild(tr);
        }

        showTable();
        console.log(`テーブル生成完了: ${data.length - 1}行のデータを表示`);
    }

    function searchYahooRealtime(keyword) {
        if (!keyword || keyword.trim() === '') {
            alert('検索キーワードが空です');
            return;
        }

        const trimmedKeyword = keyword.trim();
        const encodedKeyword = encodeURIComponent(trimmedKeyword);
        const searchURL = `https://search.yahoo.co.jp/realtime/search?p=${encodedKeyword}`;
        
        console.log(`検索キーワード: "${trimmedKeyword}"`);
        console.log(`検索URL: ${searchURL}`);
        
        window.open(searchURL, '_blank');
    }

    window.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    window.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.csv')) {
            csvFileInput.files = files;
            fileNameDisplay.textContent = `選択されたファイル: ${files[0].name}`;
            loadCSVFile(files[0]);
        }
    });
});