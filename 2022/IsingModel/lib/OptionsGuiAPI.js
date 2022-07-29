/**
 * This API can create simple menu options and items.
 * Copyright @MecanicaScience https://mecanicascience.fr.
 * Using tweakpane v1.5 API https://cdn.jsdelivr.net/npm/tweakpane@1.5/dist/tweakpane.min.js
 */
class OptionsGuiAPI {
    constructor() {
        window._optionsGUIInstance = this;
        this.usesMathJax = MathJax != undefined;
        this.newPane();
    }

    /** Reset the custom GUI */
    reset() {
        this.pane.dispose();
        this.newPane();
    }

    /** Creates a new pane */
    newPane() {
        this.pane = new Tweakpane();
        this.datas = {};
    }

    /**
    * Adds a folder
    * @param title Title of the folder
    * @param parent Parent of the folder (default 'root')
    * @param hidden Is folder hidden (default false)
    */
    addFolder(title, parent = 'root', hidden = false) {
        if (parent == 'root' || parent == undefined)
            parent = this.datas;
        let storedName = title.toLowerCase();
        let folder = (parent == this.datas ? this.pane : parent._folder).addFolder({ title, hidden });
        parent[storedName] = {
            _params: {},
            _values: {},
            _folder: folder
        };

        this.processHTMLLaTeX(folder.controller.view.elem_.children[0], 'folder');
        return parent[storedName];
    }


    /**
    * Add an integer configuration input to the screen (if you imported MathJax, uses LaTeX to display)
    * @param name         Name of the input
    * @param folder       GUI parent folder of the input
    * @param defaultValue Default value of the input (default 0)
    * @param minValue     Minimum value of the input (default 0)
    * @param maxValue     Maximum value of the input (default 10)
    * @param step         Step size
    * @return A function that returns the current value of the input
    */
    addInput(name, folder, defaultValue = 0, minValue = 0, maxValue = 10, step = undefined) {
        folder._params[name] = defaultValue;
        folder._values[name] = defaultValue;
        let newInput = folder._folder
            .addInput(folder._params, name, { min: minValue, max: maxValue, step: step })
            .on('change', (value) => folder._values[name] = value);

        if (this.usesMathJax)
            this.processHTMLLaTeX(newInput.controller.view.elem_.children[0], 'element');

        return () => folder._values[name];
    }


    /**
    * Add a button to the screen (if you imported MathJax, uses LaTeX to display)
    * @param name     Name of the button
    * @param folder   GUI parent folder of the button
    * @param callback Onclick callback
    */
    addButton(name, folder, callback) {
        let newInput = folder._folder
            .addButton({ title: name })
            .on('click', () => callback());

        if (this.usesMathJax)
            this.processHTMLLaTeX(newInput.controller.view.elem_.children[0], 'element');
    }


    /**
    * Add a list to the screen (if you imported MathJax, uses LaTeX to display)
    * @param name         Name of the list
    * @param folder       GUI parent folder of the list
    * @param values       Values of the list of format [{ text : "name1", value : "value1" }, ... ]
    * @param defaultValue Default selected value of the list (default first value)
    * @return A function that returns the current value of the input
    */
    addList(name, folder, values, defaultValue = 0) {
        if (defaultValue == 0)
            defaultValue = values[0].value;

        folder._params[name] = defaultValue;
        folder._values[name] = defaultValue;
        let newInput = folder._folder
            .addInput(folder._params, name, { options: values })
            .on('change', (value) => folder._values[name] = value);

        if (this.usesMathJax)
            this.processHTMLLaTeX(newInput.controller.view.elem_.children[0], 'element');

        return () => folder._values[name];
    }


    /**
    * Add a Vector configuration input to the screen (if you imported MathJax, uses LaTeX to display)
    * @param name         Name of the vector
    * @param folder       GUI parent folder of the vector
    * @param defaultValue Default [x, y] value of the input (default [0, 0])
    * @param minValue     Minimum [x, y] value of the input (default [0, 0])
    * @param maxValue     Maximum [x, y] value of the input (default [10, 10])
    * @return A function that returns the current value of the vector as an array [x, y]
    */
    addVector(name, folder, defaultValue = [0, 0], minValue = [0, 0], maxValue = [10, 10]) {
        let fol = this.addFolder(name, folder);
        this.addInput('x', fol, defaultValue[0], minValue[0], maxValue[0]);
        this.addInput('y', fol, defaultValue[1], minValue[1], maxValue[1]);
        return () => [fol._values['x'], fol._values['y']];
    }


    /**
    * Rename folder and inputs based on LaTeX
    * @param htmlElement HTMLElement to be handeled
    * @param type of the element ('element' or 'folder')
    */
    processHTMLLaTeX(htmlElement, type = 'element') {
        if (type == 'element')
            htmlElement.innerHTML = MathJax.tex2mml(htmlElement.innerHTML);
        else if (type == 'folder')
            htmlElement.innerHTML =
                '<div class="folder-name-tex">' + MathJax.tex2mml(htmlElement.firstChild.data) + '</div>'
                + '<div class="tp-fldv_m"></div>';
    }
}
