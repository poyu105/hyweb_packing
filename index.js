document.addEventListener("DOMContentLoaded", function () {
    // -------------------- 取得 DOM --------------------
    const countWithoutMergeButton = document.getElementById("countWithoutMergeButton");
    const countAllMergeButton = document.getElementById("countAllMergeButton");
    const countWithoutMergeAndRepeatButton = document.getElementById("countWithoutMergeAndRepeatButton");
    const resetButton = document.getElementById("resetButton");
    const resetCompareButton = document.getElementById("resetCompareButton");
    const excludeRepeatButton = document.getElementById("excludeRepeatButton");
    const compareButton = document.getElementById("compareButton");
    const fileFromDoc = document.getElementById("fileFromDoc");
    const fileFromLog = document.getElementById("fileFromLog");
    const fileFromDocCount = document.getElementById("fileFromDocCount");
    const fileFromLogCount = document.getElementById("fileFromLogCount");

    let docIsDeduped = false; // 是否已經排重過

    // -------------------- 事件綁定 --------------------
    //包版結果按鈕事件
    countWithoutMergeButton.addEventListener("click", function () {
        const input = document.getElementById("gitMessageInput").value;
        calculatePackingResultExcludeMerge(input);
    });

    //檔案統計(全部、排重)按鈕事件
    countAllMergeButton.addEventListener("click", function () {
        const input = document.getElementById("gitMessageInput").value;
        calculateFileStats(input, false); // 排除 Working tree changes, 不排 Merge
    });

    //檔案統計(排Merge、排重)按鈕事件
    countWithoutMergeAndRepeatButton.addEventListener("click", function () {
        const input = document.getElementById("gitMessageInput").value;
        calculateFileStats(input, true); // 排除 Merge + Working tree changes
    });

    //顯示檔案數量
    function updateFileCount(textarea, countInput) {
        const files = textarea.value
            .split("\n")
            .map(f => f.trim())
            .filter(f => f.length > 0);
        countInput.value = files.length;
    }

    // 當使用者離開 textarea 時更新檔案數量
    fileFromDoc.addEventListener("blur", function () {
        updateFileCount(fileFromDoc, fileFromDocCount);
    });

    fileFromLog.addEventListener("blur", function () {
        updateFileCount(fileFromLog, fileFromLogCount);
    });

    // -------------------- 清除對照 --------------------
    resetCompareButton.addEventListener("click", function () {
        document.getElementById("fileFromDoc").value = "";
        document.getElementById("fileFromLog").value = "";
        document.getElementById("notMatchFromDoc").value = "";
        document.getElementById("notMatchFromLog").value = "";
        docIsDeduped = false;
    });

    resetButton.addEventListener("click", function () {
        const ids = [
            "gitMessageInput","mantisCount","repeatCount","finalResult",
            "fileCount","fileRepeatCount","mergeFileCount",
            "modifiedCount","addedCount","deletedCount",
            "fileResult","fileRepeatResult","mergeFileResult",
            "modifiedResult","addedResult","deletedResult"
        ];
        ids.forEach(id => document.getElementById(id).value = "");
    });

    // -------------------- 包版結果 function --------------------
    function calculatePackingResultExcludeMerge(input) {
        const messageRegex = /Message:\s*([\s\S]*?)(?=(\n----|\nRevision:|$))/g;
        let matches = [];
        let match;

        while ((match = messageRegex.exec(input)) !== null) {
            matches.push(match[1].trim());
        }

        // 從尾到頭讀取
        matches = matches.reverse();

        const allMessages = [];
        for (const msg of matches) {
            if (!msg) continue;
            if (msg.startsWith("Merge")) continue;
            if (msg.includes("Working tree changes")) continue;
            allMessages.push(msg);
        }

        const uniqueMessages = [...new Set(allMessages)];
        const repeatCount = allMessages.length - uniqueMessages.length;

        document.getElementById("mantisCount").value = uniqueMessages.length;
        document.getElementById("repeatCount").value = repeatCount;
        document.getElementById("finalResult").value = uniqueMessages.join("\n");
    }

    // -------------------- 檔案統計 function --------------------
    function calculateFileStats(input, excludeMerge) {
        const allFiles = [];
        const modifiedFiles = [];
        const addedFiles = [];
        const deletedFiles = [];
        const mergeFiles = [];

        const commitBlockRegex = /Message:\s*([\s\S]*?)(?=(\nMessage:|\nRevision:|$))/g;
        let match;

        while ((match = commitBlockRegex.exec(input)) !== null) {
            const block = match[0];
            const messageLine = block.match(/Message:\s*(.*)/)?.[1]?.trim() || "";

            const isMerge = messageLine.startsWith("Merge"); //開頭為Merge
            const isWorkingTree = messageLine.includes("Working tree changes"); //開頭為Working tree changes

            if (isWorkingTree) continue; // 排除 Working tree changes
            
            // 如果是 Merge commit，就記錄 Merge 檔案 (僅統計)
            if (isMerge) {
               const  mergeLines = block.split("\n").filter(l => l.startsWith("Modified:") || l.startsWith("Added:") || l.startsWith("Deleted:"));
                mergeLines.forEach(l => mergeFiles.push(l.replace(/^(Modified:|Added:|Deleted:)/, "").trim()));
            }
            
            if (excludeMerge && isMerge) continue; // 排除 Merge

            // 處理檔案
            const lines = block.split("\n");
            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith("Modified:")) {
                    const file = line.replace("Modified:", "").trim();
                    allFiles.push(file);
                    modifiedFiles.push(file);
                } else if (line.startsWith("Added:")) {
                    const file = line.replace("Added:", "").trim();
                    allFiles.push(file);
                    addedFiles.push(file);
                } else if (line.startsWith("Deleted:")) {
                    const file = line.replace("Deleted:", "").trim();
                    allFiles.push(file);
                    deletedFiles.push(file);
                }
            });

        }

        // 去重
        const uniqueAllFiles = [...new Set(allFiles)];
        const repeatCount = allFiles.length - uniqueAllFiles.length;
        const uniqueModified = [...new Set(modifiedFiles)];
        const uniqueAdded = [...new Set(addedFiles)];
        const uniqueDeleted = [...new Set(deletedFiles)];
        const uniqueMerge = [...new Set(mergeFiles)];
        const uniqueRepeat = allFiles.filter((item, index) => allFiles.indexOf(item) !== index);

        // 更新畫面
        document.getElementById("fileCount").value = uniqueAllFiles.length;
        document.getElementById("fileRepeatCount").value = repeatCount;
        document.getElementById("mergeFileCount").value = uniqueMerge.length;

        document.getElementById("modifiedCount").value = uniqueModified.length;
        document.getElementById("addedCount").value = uniqueAdded.length;
        document.getElementById("deletedCount").value = uniqueDeleted.length;

        // 倒序輸出
        document.getElementById("fileResult").value = uniqueAllFiles.reverse().join("\n");
        document.getElementById("fileRepeatResult").value = [...new Set(uniqueRepeat)].reverse().join("\n");
        document.getElementById("mergeFileResult").value = uniqueMerge.reverse().join("\n");
        document.getElementById("modifiedResult").value = uniqueModified.reverse().join("\n");
        document.getElementById("addedResult").value = uniqueAdded.reverse().join("\n");
        document.getElementById("deletedResult").value = uniqueDeleted.reverse().join("\n");
    }

    // -------------------- 申請單排重 --------------------
    excludeRepeatButton.addEventListener("click", function () {
        let fileFromDoc = document.getElementById("fileFromDoc").value
            .split("\n")
            .map(f => f.trim())
            .filter(f => f.length > 0);

        // 去重
        fileFromDoc = [...new Set(fileFromDoc)];
        document.getElementById("fileFromDoc").value = fileFromDoc.join("\n"); //申請單檔案
        document.getElementById("fileFromDocCount").value = fileFromDoc.length || 0; //申請單檔案數量

        docIsDeduped = true; // 標記已排重
    });

    // -------------------- 比對 --------------------
    compareButton.addEventListener("click", function () {
        if (!docIsDeduped) {
            alert("請先點擊排重按鈕，再進行比對!");
            return;
        }

        const docFiles = document.getElementById("fileFromDoc").value
            .split("\n")
            .map(f => f.trim())
            .filter(f => f.length > 0);

        const logFiles = document.getElementById("fileFromLog").value
            .split("\n")
            .map(f => {
                // 移除 Git log 中的行號與變更數字部分
                return f.replace(/\s+\|\s+\d+.*$/, "").trim();
            })
            .filter(f => f.length > 0);

        const docNotInLog = docFiles.filter(docFile => {
            // 比對時只要 logFiles 中有任何一個檔案結尾匹配 docFile 即可
            return !logFiles.some(logFile => logFile.endsWith(docFile));
        });

        const logNotInDoc = logFiles.filter(logFile => {
            return !docFiles.some(docFile => logFile.endsWith(docFile));
        });

        document.getElementById("notMatchFromDoc").value = docNotInLog.join("\n"); //申請單未匹配檔案
        document.getElementById("notMatchFromLog").value = logNotInDoc.join("\n"); //異動單未匹配檔案
        document.getElementById("notMatchFromDocCount").value = docNotInLog.length || 0; //申請單未匹配檔案數量
        document.getElementById("notMatchFromLogCount").value = logNotInDoc.length || 0; //異動單未匹配檔案數量
    });
});
