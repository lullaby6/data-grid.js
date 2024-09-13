function DataGrid(options) {
    const columns = options.columns || [];
    const rows = options.rows || [];

    const width = options.width || '100%';
    const height = options.height || 'auto';

    const defaultTexts = {
        noData: 'No data',
    }
    const texts = { ...defaultTexts, ...options.texts }

    function DataGridCamelCase(cadena) {
        return cadena.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    function DataGridClassName(element, className) {
        if (typeof className == 'string') element.className = className;
        else if (typeof className == 'object') element.classList.add(...className);
    }

    function DataGridStyle(element, style) {
        if (typeof style === 'string') element.style.cssText = style;
        else if (typeof style === 'object') {
            for (const key in style) {
                element.style[key] = style[key];
            }
        }
    }

    function DataGridElement(tag, name = null) {
        if (name === null) name = tag
        const element = document.createElement(tag);
        if (options.className && options.className[name]) DataGridClassName(element, options.className[name]);
        if (options.style && options.style[name]) DataGridStyle(element, options.style[name]);
        element.classList.add(`data-grid-${DataGridCamelCase(name)}`);
        return element
    }

    this.render = element => {
        if (typeof element === 'string') element = document.querySelector(element);
        if (!element) element = document.body

        const container = DataGridElement('div', 'container')
        element.appendChild(container)

        const table = DataGridElement('table')
        container.appendChild(table);
        table.style.width = width;
        table.style.height = height;

        const thead = DataGridElement('thead')
        table.appendChild(thead);

        const tr = DataGridElement('tr')
        columns.forEach(column => {
            const th = DataGridElement('th')
            th.style.textAlign = column.align || 'left';
            if (column.width) th.style.width = column.width;
            th.setAttribute('data-grid-column-key', column.key);
            th.textContent = column.text;
            tr.appendChild(th);
        });
        thead.appendChild(tr);

        const tbody = DataGridElement('tbody')
        table.appendChild(tbody);

        rows.forEach(row => {
            const tr = DataGridElement('tr')
            columns.forEach(column => {
                const td = DataGridElement('td')
                td.style.textAlign = column.rowAlign || 'left';
                if (column.width) td.style.width = column.width;
                td.setAttribute('data-grid-column-key', column.key);
                td.textContent = row[column.key];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        if (rows.length === 0) {
            const div = DataGridElement('div', 'noDataDiv')
            const p = DataGridElement('p', 'noDataP')
            div.appendChild(p)
            p.textContent = texts.noData
            tbody.appendChild(div);
        }
    }

    return this
}