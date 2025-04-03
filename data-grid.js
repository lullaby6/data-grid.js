class DataGrid {
    constructor(options) {
        this.options = options

        this.config(options)
    }

    config(options) {
        options = { ...this.options, ...options }

        this.elements = {}

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
            limitsPrefix: 'Show',
            limitsSuffix: 'rows per page',
            searchPlaceholder: 'Search...',
            searchPrefix: 'Search:',
        }
        this.texts = { ...this.defaultTexts, ...options.texts }

        this.search = options.search || {}

        this.pagination = options.pagination || {}

        this.sort = options.pagination || {}

        return this
    }

    setArrayLength(array, length) {
        while (array.length < length) array.push(undefined)
        if (array.length > length) array.length = length
        return array
    }

    setMaxArrayLength(array, length) {
        if (array.length > length) array.length = length
        return array
    }

    cloneObjectsArray(array) {
        return array.map(object => ({ ...object }))
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
        this.elements[name] = $element
        if (this.className && this.className[name]) this.elementClassName($element, this.className[name]);
        if (this.style && this.style[name]) this.elementStyle($element, this.style[name]);
        $element.classList.add(`data-grid-${this.camelCase(name)}`);
        return $element
    }

    doSearch(value) {
        value = this.normalizeString(value)

        return this.options.rows.filter(row => {
            let searched = false

            let searchColumns = this.columnNames

            if (this.search.columns) searchColumns = this.search.columns

            searchColumns.some(columnName => {
                const column = this.columnsByName[columnName]

                if (column.search === false) return

                const cellValue = this.normalizeString(row[column.name].toString())

                if (cellValue.includes(value)) return searched = true;
            });

            return searched
        })
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

        if (this.pagination.limits) {
            const $div = this.element('div', 'limitsDiv')
            $header.appendChild($div)

            if (this.texts.limitsPrefix && typeof this.texts.limitsPrefix === 'string' && this.texts.limitsPrefix.trim() !== '') {
                const $prefix = this.element('p', 'limitsPrefix')
                $div.appendChild($prefix)
                $prefix.textContent = this.texts.limitsPrefix
            }

            const $limits = this.element('select', 'limits')
            $div.appendChild($limits)

            if (this.texts.limitsSuffix && typeof this.texts.limitsSuffix === 'string' && this.texts.limitsSuffix.trim() !== '') {
                const $suffix = this.element('p', 'limitsSuffix')
                $div.appendChild($suffix)
                $suffix.textContent = this.texts.limitsSuffix
            }

            if (this.pagination.limit === undefined) this.pagination.limit = this.pagination.limits[0]
            else if (!this.pagination.limits.includes(parseInt(this.pagination.limit))) this.pagination.limit = this.pagination.limits[0]

            this.pagination.limits.forEach(limit => {
                const $option = this.element('option')
                $option.value = limit
                $option.textContent = limit

                if (limit == this.pagination.limit) $option.selected = true

                $limits.appendChild($option)
            })

            $limits.addEventListener('change', event => {
                this.update({
                    search: {
                        ...this.search,
                        value: this.elements.search.value,
                        focus: false
                    },
                    pagination: {
                        ...this.pagination,
                        limit: $limits.value
                    }
                })
            })
        }

        if (this.search.show) {
            const $div = this.element('div', 'searchDiv')
            $header.appendChild($div)

            if (this.texts.searchPrefix && typeof this.texts.searchPrefix === 'string' && this.texts.searchPrefix.trim() !== '') {
                const $prefix = this.element('p', 'searchPrefix')
                $div.appendChild($prefix)
                $prefix.textContent = this.texts.searchPrefix
            }

            const $input = this.element('input', 'search')
            $div.appendChild($input)

            if (this.search.value) $input.value = this.search.value
            if (this.texts.searchPlaceholder && typeof this.texts.searchPlaceholder === 'string' && this.texts.searchPlaceholder.trim() !== '') $input.placeholder = this.texts.searchPlaceholder
            if (this.search.focus) $input.focus()
            if (this.search.spellcheck !== true) $input.spellcheck = false
            if (this.search.autocomplete !== true) $input.autocomplete = false

            $input.addEventListener('input', event => {
                if (this.search.onInput) this.search.onInput(event)

                this.update({
                    rows: this.doSearch($input.value),
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

        let displayRows = this.cloneObjectsArray(this.rows)

        if (this.search.value) displayRows = this.doSearch(this.search.value)

        if (this.pagination.limit) this.setMaxArrayLength(displayRows, this.pagination.limit)

        displayRows.forEach(row => {
            const $tr = this.element('tr')
            this.columns.forEach(column => {
                if (column.hidden) return

                const $td = this.element('td')
                $td.style.textAlign = column.rowAlign || 'left';
                if (column.width) $td.style.width = column.width;
                $td.textContent = row[column.name];
                $tr.appendChild($td);
            });
            $tbody.appendChild($tr);
        });

        if (this.rows.length === 0 && this.texts.noData && typeof this.texts.noData === 'string' && this.texts.noData.trim() !== '') {
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