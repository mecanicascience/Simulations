/**
 * An API that can create GUI using minimal commands count.
 * To run it, call the constructor(name, desc), then create
 * a folder createFolder(name), and then you can add widgets
 * to the folder by running add...(name, folder, ...).
 * This library requires `Mathjax` and the `Fontawesome Kit`
 * in order to work.
 * Copyright @MecanicaScience https://mecanicascience.fr.
 */
class OptionsGuiAPI {
    /**
     * Create an OptionsGUI instance
     * @param name Name of the simulation
     * @param description Short text describing the simulation
     */
    constructor(name, description) {
        // Save constructor data
        this.name = name;
        this.description = description;

        // Menu panel close and open
        document.optionsClosed = false;
        document.handleOptionsMenu = function() {
            if (document.optionsClosed) { // Open
                document.getElementById('options-panel').style = "transform: translateX(0);";
                document.getElementById('options-icon').style = "transform: translateX(296px);";
            }
            else { // Close
                document.getElementById('options-panel').style = "transform: translateX(-390px);";
                document.getElementById('options-icon').style = "transform: translateX(0);";
            }
            document.optionsClosed = !document.optionsClosed;
        }

        // Create menu toggle
        let menuToggle = this.createDiv('options-icon');
        menuToggle.id = 'options-icon';
        menuToggle.setAttribute('onclick', "handleOptionsMenu()");
        menuToggle.appendChild(this.createI('fa fa-bars'));
        document.body.appendChild(menuToggle);

        // Create default DOM
        this.createInit();

        // Create footer
        let footer = this.createDiv('op-footer');
        footer.appendChild(this.createDiv('op-footer-text', '<i class="fa fa-copyright"></i> Made by <c>MecanicaScience</c>'));
        footer.appendChild(this.createDiv('op-footer-icons',
            "<a href=\"https://www.mecanicascience.fr/\"><i class=\"fa fa-globe\"></i></a>\
            <a href=\"https://twitter.com/MecanicaSci\"><i class=\"fa fa-twitter\"></i></a>\
            <a href=\"https://github.com/mecanicascience\"><i class=\"fa fa-github\"></i></a>\
            <a href=\"https://www.youtube.com/c/MecanicaScience\"><i class=\"fa fa-youtube\"></i></a>"
        ));
        this.mainDiv.appendChild(footer);
    }

    /** Create initial DOM values. */
    createInit() {
        // Create main DOM
        let mainDiv = this.createDiv('options op-container');
        mainDiv.id = 'options-panel';

        // Title element
        let opTitle = this.createDiv('op-title');
        opTitle.appendChild(this.createDiv('op-title-t', this.name));
        let opTitleDiv = this.createDiv('op-title-b data-tooltip-marker');
        opTitleDiv.appendChild(this.createI('fa fa-info-circle'));
        opTitleDiv.appendChild(this.createDiv('data-tooltip-cont', this.description));
        opTitle.appendChild(opTitleDiv);
        mainDiv.appendChild(opTitle);
        mainDiv.appendChild(document.createElement('hr'));

        // Add DOM to body
        document.body.appendChild(mainDiv);
        this.mainDiv = mainDiv;

        // Clear data
        this.data = [];
    }

    /** Clear last GUI and create a new empty one. */
    reset() {
        // Clear
        document.getElementById('options-icon').remove();

        // New one
        this.createInit();

        // Clear data
        this.data = [];
    }

    /** Run mathjax to convert text to LaTeX */
    processMaths() {
        MathJax.typeset();
    }





    // ============ WIDGETS ============
    /**
     * Create a new folder
     * @param name Name of the folder
     */
    addFolder(name) {
        // ==== DOM ====
        let fol = this.createDiv('op-folder');
        fol.appendChild(this.createDiv('op-f-title', name));
        fol.appendChild(this.createDiv('op-f-elements'));
        this.mainDiv.appendChild(fol);
        

        // ==== LOGIC ====
        this.data.push({ id: this.data.length, dom: fol });
        return this.data[this.data.length - 1];
    }

    /**
    * Create an new input
    * @param name         Name of the input
    * @param folder       Folder of the input
    * @param defaultValue Default value of the input (default 0)
    * @param minValue     Minimum value of the input (default 0)
    * @param maxValue     Maximum value of the input (default 10)
    * @param step         Step size (default 0)
    * @param infoText     Small text bubble content describing this parameter
    * @return A callback that returns the current value of the input
    */
    addInput(name, folder, defaultValue, minValue, maxValue, step, infoText) {
        // ==== DOM ====
        let el = this.createDiv('op-f-el');
        el.appendChild(this.createDiv('op-f-el-t', name));
        let elModule = this.createDiv('op-f-el-mod');

        // Input 1
        let input1 = document.createElement('input');
        input1.className = 'op-el-range-slider';
        input1.type = 'range';
        input1.min = minValue;
        input1.max = maxValue;
        input1.step = step;
        input1.value = defaultValue;
        elModule.appendChild(input1);

        // Input 2
        let input2 = document.createElement('input');
        input2.className = 'op-el-range-value';
        input2.type = 'number';
        input2.min = minValue;
        input2.max = maxValue;
        input2.step = step;
        input2.value = defaultValue;
        elModule.appendChild(input2);

        // Info
        if (infoText != undefined) {
            let divEl = this.createDiv('op-el-range-hint data-tooltip-marker');
            divEl.appendChild(this.createI('fa fa-question-circle'));
            divEl.appendChild(this.createDiv('data-tooltip-cont', infoText));
            elModule.appendChild(divEl);
        }

        el.appendChild(elModule);
        this.data[folder.id].dom.children[1].appendChild(el);
        

        // ==== LOGIC ====
        // Update values change
        input1.addEventListener('input', () => {
            input2.value = input1.value;
        });
        input2.addEventListener('change', () => {
            input1.value = input2.value;
            input2.value = input1.value;
        });

        // Get values
        return () => input1.value;
    }

    /**
    * Create an new button
    * @param name   Name of the button
    * @param folder Folder of the button
    * @param callback The button callback on clicked
    */
    addButton(name, folder, callback) {
        // ==== DOM ====
        let el = this.createDiv('op-f-el');

        // Button
        let but = document.createElement('input');
        but.className = 'op-f-el-b';
        but.type = 'submit';
        but.value = name;

        el.appendChild(but);
        this.data[folder.id].dom.children[1].appendChild(el);


        // ==== LOGIC ====
        // Add click event
        el.addEventListener('click', callback);
    }





    // ============ UTILS ============
    /**
     * Create a DOM div element given classes
     * @param classes
     * @param content (default none)
     * @return the DOM element
     */
    createDiv(classes, content = -1) {
        let div = document.createElement('div');
        div.className = classes;
        if (content != -1)
            div.innerHTML = content;
        return div;
    }

    /**
     * Create a DOM i element given classes
     * @param classes
     * @return the DOM element
     */
    createI(classes) {
        let i = document.createElement('i');
        i.className = classes;
        return i;
    }
}
