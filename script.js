(function() {
    const { jsPDF } = window.jspdf;

    const defaultCategories = [
        { name: 'Red', color: '#ef4444' },
        { name: 'Blue', color: '#3b82f6' },
        { name: 'Green', color: '#22c55e' },
        { name: 'Yellow', color: '#eab308' },
        { name: 'Purple', color: '#8b5cf6' },
        { name: 'Orange', color: '#f97316' },
        { name: 'Pink', color: '#ec4899' }
    ];

    let currentData = [];
    let currentView = 'pie';
    let chartInstance = null;

    const chartContainer = document.getElementById('chart-container');
    const ctx = document.getElementById('chart').getContext('2d');
    const dataList = document.querySelector('.data-list');
    const buttons = document.querySelectorAll('.toggle-buttons button');
    const randomizeBtn = document.getElementById('randomize-btn');
    const filterInput = document.getElementById('filter-input');
    const exportJsonBtn = document.getElementById('export-json');
    const exportCsvBtn = document.getElementById('export-csv');
    const exportPdfBtn = document.getElementById('export-pdf');
    const summaryText = document.getElementById('summary-text');
    const categoryForm = document.getElementById('category-form');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const newCategoryColorInput = document.getElementById('new-category-color');
    const resetBtn = document.getElementById('reset-btn');

    function initializeData(categories) {
        currentData = categories.map(cat => ({
            name: cat.name,
            value: Math.floor(Math.random() * 100) + 1,
            color: cat.color || randomColor()
        }));
    }

    function randomColor() {
        const baseHue = 150 + Math.floor(Math.random() * 60);
        return `hsl(${baseHue}, 75%, 55%)`;
    }

    function randomizeValues() {
        currentData = currentData.map(item => ({
            name: item.name,
            value: Math.floor(Math.random() * 100) + 1,
            color: item.color
        }));
    }

    function updateVisualization() {
        const filteredData = applyFilter(currentData);

        const total = filteredData.reduce((sum, d) => sum + d.value, 0);
        summaryText.textContent = `Total value: ${total}`;

        if (currentView === 'list') {
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            dataList.style.display = 'block';
            document.getElementById('chart').style.display = 'none';

            dataList.innerHTML = '';

            if (filteredData.length === 0) {
                const p = document.createElement('p');
                p.style.color = '#f87171';
                p.style.fontStyle = 'italic';
                p.textContent = 'No categories match your filter.';
                dataList.appendChild(p);
                return;
            }

            filteredData.forEach((item, i) => {
                const li = document.createElement('li');
                li.setAttribute('tabindex', '0');

                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = item.color;
                swatch.title = `Color of ${item.name}`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'category-name';
                nameSpan.textContent = item.name;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'category-value';
                valueSpan.textContent = item.value;

                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.setAttribute('aria-label', `Remove category ${item.name}`);
                removeBtn.style.background = '#dc2626';
                removeBtn.style.color = '#fee2e2';
                removeBtn.style.borderRadius = '6px';
                removeBtn.style.padding = '0.3rem 0.6rem';
                removeBtn.style.fontWeight = '600';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.marginLeft = '10px';
                removeBtn.addEventListener('click', () => {
                    const index = currentData.findIndex(d => d.name === item.name);
                    if (index !== -1) {
                        currentData.splice(index, 1);
                        updateVisualization();
                    }
                });
                removeBtn.addEventListener('mouseover', () => {
                    removeBtn.style.background = '#b91c1c';
                });
                removeBtn.addEventListener('mouseout', () => {
                    removeBtn.style.background = '#dc2626';
                });

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.className = 'color-picker';
                colorInput.title = `Change color of ${item.name}`;
                colorInput.value = item.color;
                colorInput.setAttribute('aria-label', `Change color of category ${item.name}`);
                colorInput.addEventListener('input', e => {
                    item.color = e.target.value;
                    updateVisualization();
                });

                li.appendChild(swatch);
                li.appendChild(nameSpan);
                li.appendChild(valueSpan);
                li.appendChild(colorInput);
                li.appendChild(removeBtn);

                dataList.appendChild(li);
            });
        } else {
            dataList.style.display = 'none';
            document.getElementById('chart').style.display = 'block';

            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }

            if (filteredData.length === 0) {
                chartContainer.innerHTML = "<p style='color:#f87171; font-style:italic; user-select:none;'>No categories to display. Add some categories!</p>";
                return;
            }

            const chartType = currentView;
            const dataLabels = filteredData.map(d => d.name);
            const dataValues = filteredData.map(d => d.value);
            const backgroundColors = filteredData.map(d => d.color);

            chartInstance = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: dataLabels,
                    datasets: [{
                        label: 'Randomized Values',
                        data: dataValues,
                        backgroundColor: backgroundColors,
                        borderColor: '#121212',
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    animation: { duration: 800, easing: 'easeOutQuart' },
                    plugins: {
                        legend: {
                            display: chartType === 'pie',
                            position: 'right',
                            labels: { color: '#d1d5db', font: { size: 14 } },
                            onClick: function(e, legendItem, legend) {
                                const index = legendItem.index;
                                const dataset = legend.chart.data.datasets[0];
                                const meta = legend.chart.getDatasetMeta(0);
                                meta.data[index].hidden = !meta.data[index].hidden;
                                legend.chart.update();
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#4ade80',
                            titleColor: '#121212',
                            bodyColor: '#121212',
                            borderColor: '#22c55e',
                            borderWidth: 1,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                label: function(ctx) {
                                    const label = ctx.label || '';
                                    const val = ctx.parsed || 0;
                                    const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    const perc = total ? ((val / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${val} (${perc}%)`;
                                }
                            }
                        }
                    },
                    scales: chartType === 'bar' ? {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#bbf7d0',
                                font: { weight: '600', size: 14 }
                            },
                            grid: {
                                color: '#164e3c'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#bbf7d0',
                                font: { weight: '600', size: 14 }
                            },
                            grid: {
                                color: '#164e3c'
                            }
                        }
                    } : {}
                }
            });
        }
    }

    function applyFilter(data) {
        const filter = filterInput.value.trim().toLowerCase();
        if (filter === '') return data;
        return data.filter(item => item.name.toLowerCase().includes(filter));
    }

    categoryForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = newCategoryNameInput.value.trim();
        const color = newCategoryColorInput.value || randomColor();

        if (!name) return alert('Please enter a category name');

        if (currentData.some(d => d.name.toLowerCase() === name.toLowerCase())) {
            alert('Category name already exists');
            return;
        }

        currentData.push({ name, value: Math.floor(Math.random() * 100) + 1, color });
        newCategoryNameInput.value = '';
        updateVisualization();
    });

    resetBtn.addEventListener('click', () => {
        initializeData(defaultCategories);
        filterInput.value = '';
        updateVisualization();
    });

    filterInput.addEventListener('input', () => {
        updateVisualization();
    });

    exportJsonBtn.addEventListener('click', () => {
        if (currentData.length === 0) {
            alert('No data to export');
            return;
        }
        const dataStr = JSON.stringify(currentData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'randomized-data.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    exportCsvBtn.addEventListener('click', () => {
        if (currentData.length === 0) {
            alert('No data to export');
            return;
        }
        const header = ['Category', 'Value', 'Color'];
        const rows = currentData.map(c => [
            `"${c.name.replace(/"/g, '""')}"`,
            c.value,
            c.color
        ]);
        let csvContent = header.join(',') + '\n';
        rows.forEach(r => {
            csvContent += r.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'randomized-data.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    async function exportPdf() {
        if (currentData.length === 0) {
            alert('No data to export');
            return;
        }
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4',
        });

        const title = 'Interactive Data Randomizer Export';
        pdf.setFontSize(18);
        pdf.setTextColor('#4ade80');
        pdf.text(title, 40, 40);

        try {
            let elementToCapture;
            if (currentView === 'list') {
                elementToCapture = dataList;
                if (!elementToCapture || elementToCapture.childElementCount === 0) {
                    alert('No visible data in the list to export.');
                    return;
                }
            } else {
                elementToCapture = document.getElementById('chart');
                if (!elementToCapture) {
                    alert('Chart not available for export.');
                    return;
                }
            }

            // Use html2canvas to capture element
            const canvas = await html2canvas(elementToCapture, {
                scale: 2,
                backgroundColor: '#1f2937',
                scrollX: 0,
                scrollY: 0,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth() - 80; // Margin 40 left +40 right
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 40, 60, pdfWidth, pdfHeight);

            pdf.save('randomized-data.pdf');
        } catch (err) {
            alert('PDF export failed: ' + err.message);
        }
    }

    exportPdfBtn.addEventListener('click', () => {
        exportPdf();
    });

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.view === currentView) return;
            currentView = btn.dataset.view;
            buttons.forEach(b => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
            });
            updateVisualization();
        });
    });

    randomizeBtn.addEventListener('click', () => {
        randomizeValues();
        updateVisualization();
    });

    function init() {
        initializeData(defaultCategories);
        currentView = 'pie';
        buttons.forEach(b => {
            b.classList.toggle('active', b.dataset.view === 'pie');
            b.setAttribute('aria-pressed', b.dataset.view === 'pie' ? 'true' : 'false');
        });
        filterInput.value = '';
        updateVisualization();
    }

    window.onload = init;
})();
