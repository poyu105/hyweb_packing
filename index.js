document.addEventListener("DOMContentLoaded", function() {
    const countButton = document.getElementById("countButton");
    const countWithoutMergeButton = document.getElementById("countWithoutMergeButton");
    const resetButton = document.getElementById("resetButton");

    countButton.addEventListener("click", function() {
        const input = document.getElementById("gitMessageInput").value;
        calculatePackingResult(input, false);
        calculateFileStats(input, false);
    });

    countWithoutMergeButton.addEventListener("click", function() {
        const input = document.getElementById("gitMessageInput").value;
        calculatePackingResult(input, true);
        calculateFileStats(input, true);
    });

    resetButton.addEventListener("click", function() {
        const ids = ["gitMessageInput","mantisCount","repeatCount","finalResult","fileCount",
                     "modifiedCount","addedCount","deletedCount",
                     "fileResult","modifiedResult","addedResult","deletedResult"];
        ids.forEach(id => document.getElementById(id).value = "");
    });

    // -------------------- 包版結果 --------------------
    function calculatePackingResult(input, excludeMerge) {
        const messageRegex = /Message:\s*([\s\S]*?)(?=(\n----|\nRevision:|$))/g;
        let match;
        const allMessages = [];
        while ((match = messageRegex.exec(input)) !== null) {
            const msg = match[1].trim();
            if (msg 
                && (!excludeMerge || !msg.startsWith("Merge")) 
                && !msg.includes("Working tree changes")) { // 排除 Working tree changes
                allMessages.push(msg);
            }
        }

        const uniqueMessages = [...new Set(allMessages)];
        const repeatCount = allMessages.length - uniqueMessages.length;

        document.getElementById("mantisCount").value = uniqueMessages.length;
        document.getElementById("repeatCount").value = repeatCount;
        document.getElementById("finalResult").value = uniqueMessages.reverse().join("\n");
    }

    // -------------------- 檔案統計 --------------------
    function calculateFileStats(input, excludeMerge) {
        const allFiles = [];
        const modifiedFiles = [];
        const addedFiles = [];
        const deletedFiles = [];

        const lines = input.split("\n");
        let skipFiles = false;

        lines.forEach(line => {
            line = line.trim();

            if (line.startsWith("Message:")) {
                const msg = line.replace("Message:", "").trim();
                skipFiles = (excludeMerge && msg.startsWith("Merge")) || msg.includes("Working tree changes"); // 排除 Merge 或 Working tree changes
                return;
            }

            if (skipFiles) return;

            if (line.startsWith("Modified:")) {
                const file = line.replace("Modified:", "").trim();
                if (!file.includes("Working tree changes")) {
                    allFiles.push(file);
                    modifiedFiles.push(file);
                }
            } else if (line.startsWith("Added:")) {
                const file = line.replace("Added:", "").trim();
                if (!file.includes("Working tree changes")) {
                    allFiles.push(file);
                    addedFiles.push(file);
                }
            } else if (line.startsWith("Deleted:")) {
                const file = line.replace("Deleted:", "").trim();
                if (!file.includes("Working tree changes")) {
                    allFiles.push(file);
                    deletedFiles.push(file);
                }
            }
        });

        const uniqueAllFiles = [...new Set(allFiles)];
        const uniqueModified = [...new Set(modifiedFiles)];
        const uniqueAdded = [...new Set(addedFiles)];
        const uniqueDeleted = [...new Set(deletedFiles)];

        document.getElementById("fileCount").value = uniqueAllFiles.length;
        document.getElementById("modifiedCount").value = uniqueModified.length;
        document.getElementById("addedCount").value = uniqueAdded.length;
        document.getElementById("deletedCount").value = uniqueDeleted.length;

        document.getElementById("fileResult").value = uniqueAllFiles.reverse().join("\n");
        document.getElementById("modifiedResult").value = uniqueModified.reverse().join("\n");
        document.getElementById("addedResult").value = uniqueAdded.reverse().join("\n");
        document.getElementById("deletedResult").value = uniqueDeleted.reverse().join("\n");
    }
});
