class OptionsGUI {
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
        //this.addFolder('\\text{Configuration}', 'root', 'configuration');
    }

    /**
    * Adds a folder
    * @param title Title of the folder (stored as title.toLowerCase() in object if storedName undefined)
    * @param parent Parent of the folder (default 'root')
    * @param storedName Stored name of the folder in this.datas
    * @param hidden Is folder hidden (default false)
    */
    addFolder(title, parent = 'root', storedName, hidden = false) {
        if (parent == 'root')
            parent = this.datas;
        if (storedName == undefined)
            storedName = title.toLowerCase();

        let folder = (parent == this.datas ? this.pane : parent._folder).addFolder({ title, hidden });
        parent[storedName] = {
            _params: {},
            _values: {},
            _folder: folder
        };

        this.processHTMLLaTeX(folder.controller.view.elem_.children[0], 'folder');
    }


    /**
    * Add an integer configuration input to the screen (if you imported MathJax, uses LaTeX to display)
    * @param name         Name of the input
    * @param defaultValue Default value of the input (default 0)
    * @param minValue     Minimum value of the input (default 0)
    * @param maxValue     Maximum value of the input (default 10)
    * @param folder       Reference of the folder (default this.datas.configuration)
    * @param step         Size of a step for the input
    * @return A function that returns the current value of the input
    */
    addInput(name, defaultValue = 0, minValue = 0, maxValue = 10, folder = this.datas.configuration, step = undefined) {
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
    * @param callback OnClick callback
    * @param folder   Reference of the folder (default this.datas.configuration)
    */
    addButton(name, callback, folder = this.datas.configuration) {
        let newInput = folder._folder
            .addButton({ title: name })
            .on('click', () => callback());

        if (this.usesMathJax)
            this.processHTMLLaTeX(newInput.controller.view.elem_.children[0], 'element');
    }


    /**
    * Add a list to the screen (if you imported MathJax, uses LaTeX to display)
    * @param name         Name of the list
    * @param values       Values taken by the input
    * @param defaultValue Integer value of the list
    * @param folder       Reference of the folder (default this.datas.configuration)
    * @return A function that returns the current value of the input
    */
    addList(name, values, defaultValue, folder = this.datas.configuration) {
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
    * @param defaultValue Default [x, y] value of the input (default [0, 0])
    * @param minValue     Minimum [x, y] value of the input (default [0, 0])
    * @param maxValue     Maximum [x, y] value of the input (default [10, 10])
    * @return A function that returns the current value of the vector
    */
    addVector(name, defaultValue = [0, 0], minValue = [0, 0], maxValue = [10, 10]) {
        this.addFolder(name, this.datas.configuration, 'vector_' + name);
        this.addInput('x', defaultValue[0], minValue[0], maxValue[0], this.datas.configuration['vector_' + name]);
        this.addInput('y', defaultValue[1], minValue[1], maxValue[1], this.datas.configuration['vector_' + name]);

        return () => new Vector(
            this.datas.configuration['vector_' + name]._values['x'],
            this.datas.configuration['vector_' + name]._values['y']
        );
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
