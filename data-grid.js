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
        this.columnNames = this.columns.map(column => column.name);
        this.columnsByName = this.columns.reduce((acc, column) => ({ ...acc, [column.name]: column }), {});
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

    camelCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    normalizeString(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    elementClassName($element, className) {
        if (typeof className == 'string') $element.className = className;
        else if (typeof className == 'object') $element.classList.add(...className);
    }

    elementStyle($element, style) {
        if (typeof style === 'string') $element.style.cssText = style;
        else if (typeof style === 'object') {
            for (const key in style) {
                $element.style[key] = style[key];
            }
        }
    }

    element(tag, name = null) {
        if (name === null) name = tag
        const $element = document.createElement(tag);
        if (this.className && this.className[name]) this.elementClassName($element, this.className[name]);
        if (this.style && this.style[name]) this.elementStyle($element, this.style[name]);
        $element.classList.add(`data-grid-${this.camelCase(name)}`);
        return $element
    }

    render($element) {
        this.parent = $element

        if (typeof $element === 'string') $element = document.querySelector($element);
        if (!$element) $element = document.body
        if ($element != document.body) $element.innerHTML = '';

        const $container = this.element('div', 'container')
        $element.appendChild($container)

        const $header = this.element('div', 'header')
        $container.appendChild($header)

        if (this.search.show) {
            const $input = this.element('input', 'search')
            $header.appendChild($input)

            if (this.search.value) $input.value = this.search.value
            if (this.search.placeholder) $input.placeholder = this.search.placeholder
            if (this.search.focus) $input.focus()

            $input.addEventListener('input', event => {
                if (this.search.onInput) this.search.onInput(event)

                const searchValue = this.normalizeString($input.value)

                this.update({
                    rows: this.options.rows.filter(row => {
                        let searched = false

                        let searchColumns = this.columnNames

                        if (this.search.columns) searchColumns = this.search.columns

                        searchColumns.some(columnName => {
                            const column = this.columnsByName[columnName]

                            if (column.search === false) return

                            const cellValue = this.normalizeString(row[column.name].toString())

                            if (cellValue.includes(searchValue)) return searched = true;
                        });

                        return searched
                    }),
                    search: {
                        ...this.search,
                        value: $input.value,
                        focus: true
                    }
                })
            })
        }

        const $table = this.element('table')
        $container.appendChild($table);
        $table.style.width = this.width;
        $table.style.height = this.height;

        const $thead = this.element('thead')
        $table.appendChild($thead);

        const $tr = this.element('tr')
        this.columns.forEach(column => {
            if (column.hidden) return

            const $th = this.element('th')
            $th.style.textAlign = column.align || 'left';
            if (column.width) $th.style.width = column.width;
            $th.setAttribute('data-grid-column-name', column.name);
            $th.textContent = column.label;
            $tr.appendChild($th);
        });
        $thead.appendChild($tr);

        const $tbody = this.element('tbody')
        $table.appendChild($tbody);

        this.rows.forEach(row => {
            const $tr = this.element('tr')
            this.columns.forEach(column => {
                if (column.hidden) return

                const $td = this.element('td')
                $td.style.textAlign = column.rowAlign || 'left';
                if (column.width) $td.style.width = column.width;
                $td.setAttribute('data-grid-column-name', column.name);
                $td.textContent = row[column.name];
                $tr.appendChild($td);
            });
            $tbody.appendChild($tr);
        });

        if (this.rows.length === 0) {
            const $div = this.element('div', 'noDataDiv')
            const $p = this.element('p', 'noDataP')
            $div.appendChild($p)
            $p.textContent = this.texts.noData
            $tbody.appendChild($div);
        }

        const $footer = this.element('div', 'footer')
        $container.appendChild($footer)

        return this
    }

    update(options) {
        this.config(options).render(this.parent)
    }
}