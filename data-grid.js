class DataGrid {
    constructor(options) {
        this.options = options

        this.config(options)
    }

    config(options) {
        options = { ...this.options, ...options }

        this.style = options.style || {}
        this.className = options.className || {}

        this.columns = options.columns || [];
        this.rows = options.rows || [];

        this.width = options.width || '100%';
        this.height = options.height || 'auto';

        this.defaultTexts = {
            noData: 'No data',
        }
        this.texts = { ...this.defaultTexts, ...options.texts }

        this.search = options.search || {}

        return this
    }

    camelCase(string) {
        return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    elementClassName(element, className) {
        if (typeof className == 'string') element.className = className;
        else if (typeof className == 'object') element.classList.add(...className);
    }

    elementStyle(element, style) {
        if (typeof style === 'string') element.style.cssText = style;
        else if (typeof style === 'object') {
            for (const key in style) {
                element.style[key] = style[key];
            }
        }
    }

    element(tag, name = null) {
        if (name === null) name = tag
        const element = document.createElement(tag);
        if (this.className && this.className[name]) this.elementClassName(element, this.className[name]);
        if (this.style && this.style[name]) this.elementStyle(element, this.style[name]);
        element.classList.add(`data-grid-${this.camelCase(name)}`);
        return element
    }

    render(element) {
        this.parent = element

        if (typeof element === 'string') element = document.querySelector(element);
        if (!element) element = document.body
        if (element != document.body) element.innerHTML = '';

        const container = this.element('div', 'container')
        element.appendChild(container)

        const header = this.element('div', 'header')
        container.appendChild(header)

        if (this.search.show) {
            const input = this.element('input', 'search')
            header.appendChild(input)

            if (this.search.value) input.value = this.search.value
            if (this.search.placeholder) input.placeholder = this.search.placeholder
            if (this.search.focus) input.focus()

            input.addEventListener('input', event => {
                if (this.search.onInput) this.search.onInput(event)

                this.update({
                    rows: this.options.rows.filter(row => {
                        let searched = false

                        this.columns.forEach(column => {
                            if (row[column.key].toString().toLowerCase().trim().includes(input.value.toLowerCase().trim())) searched = true
                        })

                        return searched
                    }),
                    search: {
                        ...this.search,
                        value: input.value,
                        focus: true
                    }
                })
            })
        }

        const table = this.element('table')
        container.appendChild(table);
        table.style.width = this.width;
        table.style.height = this.height;

        const thead = this.element('thead')
        table.appendChild(thead);

        const tr = this.element('tr')
        this.columns.forEach(column => {
            const th = this.element('th')
            th.style.textAlign = column.align || 'left';
            if (column.width) th.style.width = column.width;
            th.setAttribute('data-grid-column-key', column.key);
            th.textContent = column.text;
            tr.appendChild(th);
        });
        thead.appendChild(tr);

        const tbody = this.element('tbody')
        table.appendChild(tbody);

        this.rows.forEach(row => {
            const tr = this.element('tr')
            this.columns.forEach(column => {
                const td = this.element('td')
                td.style.textAlign = column.rowAlign || 'left';
                if (column.width) td.style.width = column.width;
                td.setAttribute('data-grid-column-key', column.key);
                td.textContent = row[column.key];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        if (this.rows.length === 0) {
            const div = this.element('div', 'noDataDiv')
            const p = this.element('p', 'noDataP')
            div.appendChild(p)
            p.textContent = this.texts.noData
            tbody.appendChild(div);
        }

        const footer = this.element('div', 'footer')
        container.appendChild(footer)

        return this
    }

    update(options) {
        this.config(options).render(this.parent)
    }
}