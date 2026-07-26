const SHEET_ID = '1NLNOuopMBC4NtHXysrpCR_Lrsdn0LGtvOQQHYtMU4p8';
const SHEET_GID = '0';

function buildSheetUrl(sheetId, gid) {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${encodeURIComponent(gid)}`;
}

function parseGvizJson(text) {
    const jsonText = text.replace(/^[^(]*\((.*)\);?$/, '$1');
    return JSON.parse(jsonText);
}

function formatDate(value) {
    if (value === null || value === undefined || value === '') return '';
    const text = String(value);
    const dateMatch = text.match(/^Date\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*)?\)$/);
    if (dateMatch) {
        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]) + 1;
        const day = Number(dateMatch[3]);
        return `${year}年${month}月${day}日`;
    }

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        return `${year}年${month}月${day}日`;
    }

    const simpleMatch = text.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (simpleMatch) {
        const year = Number(simpleMatch[1]);
        const month = Number(simpleMatch[2]);
        const day = Number(simpleMatch[3]);
        return `${year}年${month}月${day}日`;
    }

    return text;
}

function formatTime(value) {
    if (value === null || value === undefined || value === '') return '';
    const text = String(value);
    const timeMatch = text.match(/^Date\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    if (timeMatch) {
        const hour = Number(timeMatch[1]);
        const minute = Number(timeMatch[2]);
        return `${hour}:${String(minute).padStart(2, '0')}`;
    }

    const numberValue = Number(value);
    if (!Number.isNaN(numberValue) && numberValue >= 0 && numberValue < 1) {
        const totalMinutes = Math.round(numberValue * 24 * 60);
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;
        return `${hour}:${String(minute).padStart(2, '0')}`;
    }

    const simpleTimeMatch = text.match(/^(\d{1,2}):(\d{2})/);
    if (simpleTimeMatch) {
        return `${simpleTimeMatch[1]}:${simpleTimeMatch[2]}`;
    }
    return text;
}

async function loadEvents() {
    const eventList = document.getElementById('event-list');
    const editLink = document.getElementById('edit-sheet-link');

    if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID_HERE') {
        eventList.innerHTML = '<article class="card"><h3>シートIDが設定されていません</h3><p>Google Sheets のシートIDをコード内の <code>SHEET_ID</code> に設定してください。</p></article>';
        editLink.href = '#';
        return;
    }

    editLink.href = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${SHEET_GID}`;
    const url = buildSheetUrl(SHEET_ID, SHEET_GID);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('シートを取得できませんでした');
        const text = await response.text();
        const data = parseGvizJson(text);
        const rows = data.table.rows || [];

        if (!rows.length) {
            eventList.innerHTML = '<article class="card"><h3>出演予定がまだ登録されていません</h3><p>Google Sheets にイベントを追加してから再読み込みしてください。</p></article>';
            return;
        }

        eventList.innerHTML = rows.map(row => {
            const cells = row.c.map(cell => (cell && cell.v !== null && cell.v !== undefined) ? cell.v : '');
            const [date, title, description, team, location, time] = cells;
            const formattedDate = formatDate(date);
            const formattedTime = formatTime(time);

            return `
                <article class="event-item">
                    <p class="event-item-date">${formattedDate || '日付未設定'}</p>
                    <h4 class="event-item-title">${title || 'タイトル未設定'}</h4>
                    <p class="event-item-desc">
                        ${description || '説明がありません。'}<br>
                        ${team ? `<strong>出演予定チーム:</strong> ${team}<br>` : ''}
                        ${location ? `<strong>場所:</strong> ${location}<br>` : ''}
                        ${formattedTime ? `<strong>出演予定時間:</strong> ${formattedTime}` : ''}
                    </p>
                </article>
            `;
        }).join('');
    } catch (error) {
        eventList.innerHTML = `<article class="card"><h3>データの読み込みに失敗しました</h3><p>${error.message}</p></article>`;
    }
}

window.addEventListener('DOMContentLoaded', loadEvents);
