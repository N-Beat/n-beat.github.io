const LESSON_SHEET_ID = '1-c6DmJe-vp9AIcYSO7ctG472xdMPnYQTjP7-gkMQeiM';
const LESSON_GID = '0';
const EVENT_SHEET_ID = '1NLNOuopMBC4NtHXysrpCR_Lrsdn0LGtvOQQHYtMU4p8';
const EVENT_GID = '0';

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

    const simpleMatch = text.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
        return `${simpleMatch[1]}:${simpleMatch[2]}`;
    }

    return text;
}

function renderEvents(rows) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;

    if (!rows.length) {
        eventList.innerHTML = '<article class="card"><h3>イベントが登録されていません</h3><p>Google Sheets にイベントを追加してから再読み込みしてください。</p></article>';
        return;
    }

    eventList.innerHTML = rows.map(row => {
        const cells = row.c.map(cell => (cell && cell.v !== null && cell.v !== undefined) ? cell.v : '');
        const [date, title, description, team, location, time] = cells;
        const formattedDate = formatDate(date);
        const formattedTime = formatTime(time);

        return `
            <article class="card">
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
}

function renderSchedule(rows, cols) {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    if (!rows.length) {
        scheduleList.innerHTML = '<article class="card"><h3>スケジュール情報が登録されていません</h3><p>Google Sheets にスケジュール情報を追加してから再読み込みしてください。</p></article>';
        return;
    }

    const formatScheduleValue = value => {
        if (value === null || value === undefined || value === '') return '未設定';
        const text = String(value);
        if (/^Date\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(text)) {
            return formatTime(text);
        }
        if (/^Date\(\s*\d+\s*,\s*\d+\s*,\s*\d+\)/.test(text)) {
            return formatDate(text);
        }
        return text;
    };

    const scheduleItems = rows.map(row => {
        const cells = row.c.map(cell => (cell && cell.v !== null && cell.v !== undefined) ? cell.v : '');
        return {
            lesson: cells[0] || '未設定',
            genre: cells[1] || '',
            target: cells[2] || '',
            description: cells[3] || '',
            day: cells[4] || '未定',
            start: formatScheduleValue(cells[5]),
            end: formatScheduleValue(cells[6])
        };
    });

    const dayOrder = ['月', '火', '水', '木', '金', '土', '日'];
    const grouped = dayOrder
        .map(day => ({ day, items: scheduleItems.filter(item => item.day === day) }))
        .filter(group => group.items.length > 0);

    const otherItems = scheduleItems.filter(item => !dayOrder.includes(item.day) && item.day !== '未定');
    if (otherItems.length) {
        grouped.push({ day: 'その他', items: otherItems });
    }
    const undatedItems = scheduleItems.filter(item => item.day === '未定');
    if (undatedItems.length) {
        grouped.push({ day: '未定', items: undatedItems });
    }

    scheduleList.innerHTML = `
        <div class="timetable-grid">
            ${grouped.map(group => `
                <section class="timetable-day">
                    <h4>${group.day}${group.day === 'その他' || group.day === '未定' ? '' : '曜日'}</h4>
                    ${group.items.map(item => `
                        <div class="timetable-entry">
                            <div class="timetable-time">${item.start}${item.end ? ` 〜 ${item.end}` : ''}</div>
                            <div class="timetable-lesson">${item.lesson}</div>
                            <div class="timetable-meta">${item.genre}${item.genre && item.target ? '・' : ''}${item.target}</div>
                            ${item.description ? `<p class="timetable-desc">${item.description}</p>` : ''}
                        </div>
                    `).join('')}
                </section>
            `).join('')}
        </div>
    `;
}

async function loadEvents() {
    const eventList = document.getElementById('event-list');
    const editLink = document.getElementById('edit-sheet-link');

    if (editLink) {
        editLink.href = `https://docs.google.com/spreadsheets/d/${EVENT_SHEET_ID}/edit#gid=${EVENT_GID}`;
    }

    if (!eventList) return;

    try {
        const response = await fetch(buildSheetUrl(EVENT_SHEET_ID, EVENT_GID));
        if (!response.ok) throw new Error('イベントシートを取得できませんでした');
        const text = await response.text();
        const data = parseGvizJson(text);
        const rows = data.table.rows || [];
        renderEvents(rows);
    } catch (error) {
        eventList.innerHTML = `<article class="card"><h3>読み込みに失敗しました</h3><p>${error.message}</p></article>`;
    }
}

async function loadSchedule() {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    try {
        const response = await fetch(buildSheetUrl(LESSON_SHEET_ID, LESSON_GID));
        if (!response.ok) throw new Error('スケジュールシートを取得できませんでした');
        const text = await response.text();
        const data = parseGvizJson(text);
        const rows = data.table.rows || [];
        const cols = data.table.cols || [];
        renderSchedule(rows, cols);
    } catch (error) {
        scheduleList.innerHTML = `<article class="card"><h3>読み込みに失敗しました</h3><p>${error.message}</p></article>`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadSchedule();
});
