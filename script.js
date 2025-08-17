document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csvFile');
    const fileNameDisplay = document.getElementById('fileName');
    const loadDefaultBtn = document.getElementById('loadDefault');
    const clearTableBtn = document.getElementById('clearTable');
    const dataTable = document.getElementById('dataTable');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    let csvData = [];

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
                generateTable(csvData);
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
                        generateTable(csvData);
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

    function generateTable(data) {
        if (!data || data.length === 0) {
            showError('CSVデータが空です');
            return;
        }

        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';

        const headers = data[0];
        const headerRow = document.createElement('tr');
        
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