// PENTING: Ganti dengan URL Google Apps Script Web App Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMNjyZvoracrqe3RopasJ2X5fmlCZ141ZFUrpSHLQpG2G_2EvWXFO3F5Y-YtVB602A/exec';

// ELEMEN-ELEMEN DOM
const form = document.getElementById('transaction-form');
const submitButton = document.getElementById('submit-button');
const buttonText = document.getElementById('button-text');
const buttonLoader = document.getElementById('button-loader');
const transactionList = document.getElementById('transaction-list');
const listLoader = document.getElementById('list-loader');

const totalPemasukanEl = document.getElementById('total-pemasukan');
const totalPengeluaranEl = document.getElementById('total-pengeluaran');
const saldoAkhirEl = document.getElementById('saldo-akhir');

const filterBulan = document.getElementById('filter-bulan');
const filterJenis = document.getElementById('filter-jenis');
const filterPencarian = document.getElementById('filter-pencarian');

// Elemen Modal Edit
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModalButton = document.getElementById('close-modal-button');
const cancelEditButton = document.getElementById('cancel-edit-button');

// Elemen Modal Konfirmasi Hapus
const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
const cancelDeleteButton = document.getElementById('cancel-delete-button');
const confirmDeleteButton = document.getElementById('confirm-delete-button');

// Elemen Modal Status
const statusModal = document.getElementById('status-modal');
const statusModalIcon = document.getElementById('status-modal-icon');
const statusModalTitle = document.getElementById('status-modal-title');
const statusModalMessage = document.getElementById('status-modal-message');
const statusModalCloseButton = document.getElementById('status-modal-close-button');

// Elemen Navigasi & Sidebar
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const appContainer = document.getElementById('app-container');
const toggleSaldoButton = document.getElementById('toggle-saldo-button');
const iconEyeOpen = document.getElementById('icon-eye-open');
const iconEyeClosed = document.getElementById('icon-eye-closed');

// VARIABEL GLOBAL
let doughnutChart;
let dailyExpenseChart;
let dailyIncomeChart;
let allTransactions = [];
let isBalanceVisible = true;

// FUNGSI NAVIGASI
const navigateTo = (pageId) => {
    pages.forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');

    const targetLinkSelector = `[data-page="${pageId}"]`;
    navLinks.forEach(link => link.classList.remove('active'));
    mobileNavLinks.forEach(link => link.classList.remove('active'));

    document.querySelectorAll(targetLinkSelector).forEach(link => link.classList.add('active'));

    // Set tanggal hari ini jika membuka halaman tambah transaksi
    if (pageId === 'page-new-transaction') {
        document.getElementById('tanggal').valueAsDate = new Date();
    }
};

// FUNGSI BANTUAN
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

const showStatusModal = (status, title, message) => {
    const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

    if (status === 'success') {
        statusModalIcon.innerHTML = successIcon;
        statusModalCloseButton.className = 'mt-6 w-full font-bold py-2.5 px-4 rounded-md bg-green-500 text-white hover:bg-green-600';
    } else {
        statusModalIcon.innerHTML = errorIcon;
        statusModalCloseButton.className = 'mt-6 w-full font-bold py-2.5 px-4 rounded-md bg-red-500 text-white hover:bg-red-600';
    }

    statusModalTitle.textContent = title;
    statusModalMessage.textContent = message;
    statusModal.classList.remove('hidden');
};

const closeStatusModal = () => {
    statusModal.classList.add('hidden');
};

// FUNGSI-FUNGSI RENDER TAMPILAN
const renderHistoryList = (transactions) => {
    transactionList.innerHTML = '';
    if (listLoader) listLoader.classList.add('hidden');

    if (transactions.length === 0) {
        transactionList.innerHTML = `<div class="text-center py-10 px-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p class="text-slate-500">Tidak ada transaksi yang cocok dengan filter Anda.</p>
        </div>`;
        return;
    }

    transactions.forEach(trx => {
        const isPemasukan = trx.jenis === 'Pemasukan';
        const item = document.createElement('div');
        item.className = 'bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-2';

        const leftSection = document.createElement('div');
        leftSection.className = 'flex items-center gap-4';

        const iconBgClass = isPemasukan ? 'bg-green-100' : 'bg-red-100';
        const iconTextClass = isPemasukan ? 'text-green-600' : 'text-red-600';
        const iconSvg = isPemasukan ?
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>` :
            `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>`;

        leftSection.innerHTML = `
            <div class="${iconBgClass} ${iconTextClass} p-3 rounded-full">
                ${iconSvg}
            </div>
            <div>
                <p class="font-semibold text-slate-800">${trx.deskripsi}</p>
                <p class="text-sm text-slate-500">${new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>`;

        const rightSection = document.createElement('div');
        rightSection.className = 'flex items-center gap-3 md:gap-4';

        const amountEl = document.createElement('p');
        amountEl.className = `font-bold text-right text-sm md:text-base ${isPemasukan ? 'text-green-600' : 'text-red-600'}`;
        amountEl.textContent = `${isPemasukan ? '+' : '-'}${formatRupiah(trx.jumlah)}`;

        const actionButtons = document.createElement('div');
        actionButtons.className = 'flex gap-1';
        actionButtons.innerHTML = `
            <button onclick="openEditModal(${trx.id}, '${trx.tanggal}', '${trx.jenis}', '${encodeURIComponent(trx.deskripsi)}', ${trx.jumlah})" class="text-slate-400 hover:text-blue-600 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
            </button>
            <button onclick="openDeleteConfirmationModal(${trx.id})" class="text-slate-400 hover:text-red-600 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
            </button>
        `;

        rightSection.appendChild(amountEl);
        rightSection.appendChild(actionButtons);
        item.appendChild(leftSection);
        item.appendChild(rightSection);
        transactionList.appendChild(item);
    });
};

const updateSummaryAndCharts = (transactionsForPeriod) => {
    const totalPemasukanGlobal = allTransactions.filter(t => t.jenis === 'Pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
    const totalPengeluaranGlobal = allTransactions.filter(t => t.jenis === 'Pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
    const saldoGlobal = totalPemasukanGlobal - totalPengeluaranGlobal;

    if (isBalanceVisible) {
        saldoAkhirEl.textContent = formatRupiah(saldoGlobal);
    } else {
        saldoAkhirEl.textContent = 'Rp *******';
    }

    const pemasukanPeriod = transactionsForPeriod.filter(t => t.jenis === 'Pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
    const pengeluaranPeriod = transactionsForPeriod.filter(t => t.jenis === 'Pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);
    totalPemasukanEl.textContent = formatRupiah(pemasukanPeriod);
    totalPengeluaranEl.textContent = formatRupiah(pengeluaranPeriod);

    renderDoughnutChart(transactionsForPeriod);
    renderDailyCharts(transactionsForPeriod);
};

const renderDoughnutChart = (transactions) => {
    const ctx = document.getElementById('doughnut-chart-dashboard').getContext('2d');
    const pemasukan = transactions.filter(t => t.jenis === 'Pemasukan').reduce((sum, t) => sum + t.jumlah, 0);
    const pengeluaran = transactions.filter(t => t.jenis === 'Pengeluaran').reduce((sum, t) => sum + t.jumlah, 0);

    if (doughnutChart) doughnutChart.destroy();

    doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [pemasukan, pengeluaran],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderColor: '#f8fafc',
                borderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatRupiah(context.parsed)}` } }
            }
        },
    });
};

const renderDailyCharts = (transactions) => {
    const filterValue = filterBulan.value;
    const year = filterValue ? parseInt(filterValue.split('-')[0]) : new Date().getFullYear();
    const month = filterValue ? parseInt(filterValue.split('-')[1]) - 1 : new Date().getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const dailyExpenses = new Array(daysInMonth).fill(0);
    const dailyIncomes = new Array(daysInMonth).fill(0);

    transactions.forEach(trx => {
        const trxDate = new Date(trx.tanggal);
        if (trxDate.getFullYear() === year && trxDate.getMonth() === month) {
            const dayOfMonth = trxDate.getDate() - 1;
            if (trx.jenis === 'Pengeluaran') {
                dailyExpenses[dayOfMonth] += trx.jumlah;
            } else if (trx.jenis === 'Pemasukan') {
                dailyIncomes[dayOfMonth] += trx.jumlah;
            }
        }
    });

    const expenseCtx = document.getElementById('daily-expense-chart').getContext('2d');
    if (dailyExpenseChart) dailyExpenseChart.destroy();
    dailyExpenseChart = new Chart(expenseCtx, getLineChartConfig('Pengeluaran Harian', labels, dailyExpenses, '#ef4444'));

    const incomeCtx = document.getElementById('daily-income-chart').getContext('2d');
    if (dailyIncomeChart) dailyIncomeChart.destroy();
    dailyIncomeChart = new Chart(incomeCtx, getLineChartConfig('Pemasukan Harian', labels, dailyIncomes, '#22c55e'));
};

const getLineChartConfig = (label, labels, data, color) => {
    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: `${color}33`,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: color,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatRupiah(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            if (value >= 1000000) return `${value / 1000000} Jt`;
                            if (value >= 1000) return `${value / 1000} Rb`;
                            return value;
                        }
                    }
                }
            }
        }
    };
};


// FUNGSI-FUNGSI DATA & AKSI
const fetchTransactions = async () => {
    if (listLoader) listLoader.classList.remove('hidden');
    transactionList.innerHTML = '';
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const data = await response.json();
        allTransactions = data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        applyFilters();
    } catch (error) {
        console.error('Error fetching data:', error);
        if (listLoader) listLoader.classList.add('hidden');
        transactionList.innerHTML = `<div class="text-center py-10 text-red-500">Gagal memuat data. Periksa koneksi atau URL script.</div>`;
    }
};

const applyFilters = () => {
    let filteredTransactions = [...allTransactions];
    const bulan = filterBulan.value;
    const jenis = filterJenis.value;
    const searchTerm = filterPencarian.value.toLowerCase();

    let transactionsForPeriod = [...allTransactions];
    if (bulan) {
        transactionsForPeriod = transactionsForPeriod.filter(t => {
            const tgl = new Date(t.tanggal);
            return `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, '0')}` === bulan;
        });
    }

    let transactionsForHistory = [...transactionsForPeriod];
    if (jenis !== 'Semua') {
        transactionsForHistory = transactionsForHistory.filter(t => t.jenis === jenis);
    }

    if (searchTerm) {
        transactionsForHistory = transactionsForHistory.filter(t =>
            t.deskripsi.toLowerCase().includes(searchTerm)
        );
    }

    renderHistoryList(transactionsForHistory);
    updateSummaryAndCharts(transactionsForPeriod);
};

window.openEditModal = (id, tanggal, deskripsiEncoded, jenis, jumlah) => {
    const deskripsi = decodeURIComponent(deskripsiEncoded);
    editForm.querySelector('#edit-id').value = id;
    editForm.querySelector('#edit-tanggal').value = new Date(tanggal).toISOString().split('T')[0];
    editForm.querySelector('#edit-jenis').value = jenis;
    editForm.querySelector('#edit-deskripsi').value = deskripsi;
    editForm.querySelector('#edit-jumlah').value = jumlah;
    editModal.classList.remove('hidden');
};

const closeEditModal = () => {
    editModal.classList.add('hidden');
    editForm.reset();
};

window.openDeleteConfirmationModal = (id) => {
    confirmDeleteButton.dataset.id = id;
    deleteConfirmationModal.classList.remove('hidden');
};

const closeDeleteConfirmationModal = () => {
    deleteConfirmationModal.classList.add('hidden');
};

const executeDelete = async (id) => {
    const loader = document.createElement('div');
    loader.className = 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50';
    loader.innerHTML = `<div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>`;
    document.body.appendChild(loader);

    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', id);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.result !== 'success') throw new Error(result.message);

        showStatusModal('success', 'Berhasil Dihapus', 'Transaksi yang dipilih telah dihapus dari catatan Anda.');
        await fetchTransactions();
    } catch (error) {
        showStatusModal('error', 'Gagal Menghapus', error.message);
    } finally {
        document.body.removeChild(loader);
    }
};


// EVENT LISTENERS
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    buttonText.classList.add('hidden');
    buttonLoader.classList.remove('hidden');
    submitButton.disabled = true;

    const formData = new FormData(form);
    formData.append('action', 'create');

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.result !== 'success') throw new Error(result.message || 'Terjadi kesalahan');

        showStatusModal('success', 'Berhasil Disimpan', 'Transaksi baru Anda telah ditambahkan.');
        form.reset();
        await fetchTransactions();
        navigateTo('page-dashboard');
    } catch (error) {
        console.error('Error submitting form:', error);
        showStatusModal('error', 'Gagal Menyimpan', error.message);
    } finally {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
        submitButton.disabled = false;
    }
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveButton = editForm.querySelector('#save-edit-button');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span>Menyimpan...</span>';

    const formData = new FormData(editForm);

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.result !== 'success') throw new Error(result.message);

        showStatusModal('success', 'Berhasil Diubah', 'Perubahan pada transaksi Anda telah disimpan.');
        closeEditModal();
        await fetchTransactions();
    } catch (error) {
        showStatusModal('error', 'Gagal Mengubah', error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<span>Simpan Perubahan</span>';
    }
});

filterBulan.addEventListener('change', applyFilters);
filterJenis.addEventListener('change', applyFilters);
filterPencarian.addEventListener('input', applyFilters);

closeModalButton.addEventListener('click', closeEditModal);
cancelEditButton.addEventListener('click', closeEditModal);

cancelDeleteButton.addEventListener('click', closeDeleteConfirmationModal);
confirmDeleteButton.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    closeDeleteConfirmationModal();
    executeDelete(id);
});

statusModalCloseButton.addEventListener('click', closeStatusModal);

// Event Listener untuk Navigasi
[...navLinks, ...mobileNavLinks].forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.dataset.page;
        navigateTo(pageId);
    });
});

// Event Listener untuk Sidebar Toggle
sidebarToggle.addEventListener('click', () => {
    appContainer.classList.toggle('sidebar-hidden');
});

// Event listener untuk Toggle Saldo
toggleSaldoButton.addEventListener('click', () => {
    isBalanceVisible = !isBalanceVisible;
    iconEyeOpen.classList.toggle('hidden');
    iconEyeClosed.classList.toggle('hidden');
    applyFilters(); // Panggil applyFilters untuk memperbarui tampilan saldo
});

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('page-dashboard');

    const today = new Date();
    document.getElementById('tanggal').valueAsDate = today;

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    filterBulan.value = `${year}-${month}`;

    fetchTransactions();
});
