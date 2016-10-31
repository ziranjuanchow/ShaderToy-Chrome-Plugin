/* global gShaderToy, window, document */

(function shadertoyPlugin() {

    'strict mode';

    /**
     * Stores ToyPlug instance.
     *
     * @type {ToyPlug}
     */
    var tp,

        /**
         * Stores references to ShaderToy HTML elements.
         */
        shaderToyElements = {
            shaderInfo: document.getElementById('shaderInfo')
        };

    /**
     * ToyPlug. Plugin.
     *
     * @contructor
     */
    function ToyPlug() {
        this.init();
    }

    /**
     * @returns {boolean} True if current page is editor page.
     */
    ToyPlug.prototype.isEditPage = function isEditPage() {
        return document.location.href.match(/(.com\/view|.com\/new)/);
    };

    /**
     * Turns on/off dark theme.
     */
    ToyPlug.prototype.toggleDarkTheme = function() {
        if (this.editPage) {
            this.editPage.switchEditorToDark(window.darkTheme);
        }

        this.common.switchToDarkTheme();
    };

    ToyPlug.prototype.setRenderMode = function setRenderMode(mode) {
        if (this.editPage) {
            this.editPage.setRenderMode(mode);
        }
    };

    /**
     * Inits ToyPlug functionality.
     */
    ToyPlug.prototype.init = function init() {
        this.common = new ToyPlugCommon();

        if (this.isEditPage()) {
            this.editPage = new ToyPlugEditPage();
        }
    };

    /**
     * Provides functionality for every type of shadertoy page.
     *
     * @constructor
     */
    function ToyPlugCommon() {
        this.init();
    }

    /**
     * Inits common functionality.
     */
    ToyPlugCommon.prototype.init = function init() {
        this.switchToDarkTheme();
    };

    /**
     * Swithces Shadertoy to dark theme.
     */
    ToyPlugCommon.prototype.switchToDarkTheme = function switchToDarkTheme() {
        document.body.classList.remove('dark-toy');
        if (window.darkTheme) document.body.classList.add('dark-toy');
    };

    /**
     * Provides additional functionality to Shadertoy's edit page.
     *
     * @constructor
     */
    function ToyPlugEditPage() {
        this.init();
    }

    /**
     * Initializes.
     */
    ToyPlugEditPage.prototype.init = function init() {

        /**
         * Body class name for fullscreen edit.
         *
         * @type {string}
         */
        this.FULLSCREEN_MODE_CLASS = 'fullscreen-edit';

        /**
         * Main Shadertoy canvas HTML id attribute.
         *
         * @type {string}
         */
        this.MAIN_SHADERTOY_DEMO_ID = 'demogl';

        /**
         * Main Shadertoy canvas (shader holder).
         *
         * @type {HTMLElement}
         */
        this.c = document.getElementById(this.MAIN_SHADERTOY_DEMO_ID);

        /**
         * Current Shadertoy demo canvas resolution divider.
         *
         * @type {number}
         */
        this.currentDivider = 1;

        this.switchEditorToDark(window.darkTheme);
        this.bindKeys();
        this.timebar = new Timebar();
        this.mouseUniforms = new MouseUniforms();
        this.duplicateShader();
    };

    /**
     * Waits for CodeMirror editor to init, then changes it's theme.
     */
    ToyPlugEditPage.prototype.switchEditorToDark =
        function switchEditorToDark(isDark) {
            var ed = null,
                edClass = isDark ? 'cm-s-twilight' : 'cm-s-default';

            function waitForCodeMirror() {
                ed = document.querySelector('.CodeMirror');

                if (ed) {
                    ed.classList.remove('cm-s-default');
                    ed.classList.remove('cm-s-twilight');
                    ed.classList.add(edClass);
                } else {
                    window.setTimeout(function() {
                        waitForCodeMirror();
                    }, 10);
                }
            }

            waitForCodeMirror();
        };

    /**
     * Changes Shader resolution.
     * Resolution calculation is based on divider and depends of fullscreen
     * mode.
     *
     * @param {number} divider
     */
    ToyPlugEditPage.prototype.decraseRes = function decraseRes(divider) {
        var b = this.c.getBoundingClientRect(),
            n = {
                w: b.width / divider,
                h: b.height / divider
            };

        gShaderToy.resize(n.w, n.h);
        this.currentDivider = divider;
    };

    /**
     * Attaches additional keys support.
     */
    ToyPlugEditPage.prototype.bindKeys = function bindKeys() {

        var self = this;

        document.addEventListener('keydown', function(e) {

            var which = e.which;

            if (e.target.id === self.MAIN_SHADERTOY_DEMO_ID) {

                // 1...9 Keys
                if (which == Math.max(49, Math.min(57, which))) {
                    self.decraseRes(which - 48);
                }

                // Alt (or Cmd) + arrow ..
                if (e.altKey || e.metaKey) {

                    // ... up
                    if (which == 38) {
                        gShaderToy.pauseTime();
                    }

                    // ... down
                    if (which == 40) {
                        gShaderToy.resetTime();
                    }
                }

                // shift + ctrl + s
                if (e.ctrlKey && e.shiftKey && e.which == '83') {
                    self.takeScreenShot();
                }
            }

            // shift + ctrl + enter
            if (e.which == 13 && e.shiftKey && e.ctrlKey) {
                self.toggleFullScreenEdit();
            }
        });
    };

    /**
     * Toggles fullscreen edit mode.
     */
    ToyPlugEditPage.prototype.toggleFullScreenEdit =
        function toggleFullScreenEdit() {
            var isFS = document.body.classList
                    .contains(this.FULLSCREEN_MODE_CLASS);

            document.body.classList[isFS ? 'remove' : 'add'](
                this.FULLSCREEN_MODE_CLASS
            );
            this.decraseRes(this.currentDivider);
        };

    ToyPlugEditPage.prototype.setRenderMode = function setRenderMode(mode) {
        this.c.style.imageRendering = mode;
    };

    ToyPlugEditPage.prototype.takeScreenShot = function takeScreenShot() {
        var imageData = null,
            currentDivider = this.currentDivider,
            paused = gShaderToy.mIsPaused;

        if (!paused) gShaderToy.pauseTime();
        this.decraseRes(currentDivider * 0.25);

        window.setTimeout(function() {
            imageData = gShaderToy.mGLContext.canvas.toDataURL('image/png');
        }, 100);

        window.setTimeout(function() {
            this.decraseRes(currentDivider);
            window.open(imageData);
            if (!paused) gShaderToy.pauseTime();
        }.bind(this), 1000);
    };

    ToyPlugEditPage.prototype.duplicateShader = function duplicateShader() {
        var publishWrapper = document.getElementById('shaderPublished'),
            duplicate = document.createElement('div');

        if (publishWrapper) {
            duplicate.classList.add('formButton');
            duplicate.style.marginLeft = "12px";
            duplicate.style.display = "inline-block";
            duplicate.textContent = 'Save as new draft';

            publishWrapper.appendChild(duplicate);
            duplicate.addEventListener('click', function() {
                if (
                    (gShaderToy.mNeedsSave &&
                        window.confirm('Current shader will be saved as new draft. Page will be reloaded. Continue?')
                    ) || !gShaderToy.mNeedsSave) {
                        gShaderToy.mInfo.username = "None";
                        gShaderToy.mInfo.id = "-1";
                        document.getElementById('published').value = "0";
                        window.openSubmitShaderForm(false);
                    }
            });
        }
    };

    /**
     * Provides timebar functionality.
     *
     * @contructor
     */
    function Timebar() {
        this.loop = window.TimebarLoop;
        this.busy = false;
        this.wasPaused = false;

        this.createElements();

        this.sliderInput.addEventListener(
            'mousedown',
            this.sliderOnMouseDown.bind(this)
        );

        this.sliderInput.addEventListener(
            'mouseup',
            this.sliderOnMouseUp.bind(this)
        );

        this.sliderInput.addEventListener(
            'input',
            this.updateShaderToy.bind(this)
        );

        this.minValueInput.addEventListener(
            'change',
            this.onChangeMinInput.bind(this)
        );

        this.maxValueInput.addEventListener(
            'change',
            this.onChangeMaxInput.bind(this)
        );

        this.updateSlider();
    }

    /**
     * Creates and appends timebar elements to ShaderToy.
     */
    Timebar.prototype.createElements = function createElements() {
        this.sliderBar = document.createElement('div');
        this.minValueInput = document.createElement('input');
        this.sliderInput = document.createElement('input');
        this.maxValueInput = document.createElement('input');

        shaderToyElements.shaderInfo.insertBefore(
            this.sliderBar,
            shaderToyElements.shaderInfo.childNodes[0]
        );

        this.sliderBar.classList.add('time-slider');

        this.sliderBar.appendChild(this.minValueInput);
        this.sliderBar.appendChild(this.sliderInput);
        this.sliderBar.appendChild(this.maxValueInput);

        this.sliderInput.type = 'range';
        this.minValueInput.type = this.maxValueInput.type = 'number';

        this.minValueInput.value = 0;
        this.minValueInput.min = 0;

        this.maxValueInput.value = 60;
        this.maxValueInput.min = 1;

        this.sliderInput.min = 0;
        this.sliderInput.max = 60 * 1000;
        this.sliderInput.value = 0;
        this.sliderInput.step = 20;
    };

    Timebar.prototype.onChangeMinInput = function onChangeMinInput() {
        this.maxValueInput.min = parseInt(this.minValueInput.value, 10) + 1;
        this.maxValueInput.value = Math.max(
            parseInt(this.maxValueInput.value, 10),
            parseInt(this.minValueInput.value, 10) + 1
        );
        this.sliderInput.min = parseInt(this.minValueInput.value, 10) * 1000;
    };

    Timebar.prototype.onChangeMaxInput = function onChangeMinInput() {
        this.minValueInput.max = parseInt(this.maxValueInput.value, 10);
        this.minValueInput.value = Math.min(
            parseInt(this.maxValueInput.value, 10) - 1,
            parseInt(this.minValueInput.value, 10)
        );
        this.sliderInput.max = parseInt(this.maxValueInput.value, 10) * 1000;
    };

    /**
     * Sets slider to ShaderToy time.
     */
    Timebar.prototype.updateSlider = function updateSlider() {
        this.loop = window.TimebarLoop;

        var outsideLoop = false;

        if (gShaderToy && !this.busy) {
            this.sliderInput.value = gShaderToy.mTf;
        }

        if (this.loop && gShaderToy.mTf > this.maxValueInput.value * 1000) {
            this.sliderInput.value = this.minValueInput.value * 1000;
            outsideLoop = true;
        }

        if (this.loop && gShaderToy.mTf < this.minValueInput.value * 1000) {
            this.sliderInput.value = this.minValueInput.value * 1000;
            outsideLoop = true;
        }

        if (outsideLoop) {
            this.updateShaderToy();
            this.updateInputs(this.sliderInput.value);
        }

        setTimeout(this.updateSlider.bind(this), 26);
    };

    /**
     * Handles click on slider.
     */
    Timebar.prototype.sliderOnMouseDown = function sliderOnMouseDown() {
        this.wasPaused = gShaderToy.mIsPaused;
        this.sliderInput.min = parseInt(this.minValueInput.value * 1000, 10);
        this.sliderInput.max = parseInt(this.maxValueInput.value * 1000, 10);
        if (!this.wasPaused) {
            this.busy = true;
            gShaderToy.pauseTime();
        }
        return false;
    };

    /**
     * Handles relase slider click.
     */
    Timebar.prototype.sliderOnMouseUp = function sliderOnMouseUp() {
        if (!this.wasPaused) gShaderToy.pauseTime();

        requestAnimationFrame(function() {
            this.updateShaderToy(!this.wasPaused);
            this.updateInputs(this.sliderInput.value);
            this.busy = false;
        }.bind(this));
    };

    /**
     * Handles user changing slider value.
     */
    Timebar.prototype.sliderOnChange = function sliderOnChange() {
        this.updateShaderToy();
    };

    /**
     * Updates ShaderToy with slider value.
     */
    Timebar.prototype.updateShaderToy = function updateShaderToy(togglePause) {
        var value = parseInt(this.sliderInput.value, 10),
            i = 0;

        gShaderToy.pauseTime();

        gShaderToy.mFpsFrame = ~~(value / 1000 * 60);
        gShaderToy.mForceFrame = true;
        gShaderToy.mRestarted = true;
        gShaderToy.mFpsTo = gShaderToy.mTo;
        gShaderToy.mEffect.mFrame = gShaderToy.mFpsFrame;

        for (i; i < gShaderToy.mEffect.mPasses.length; i++ ) {
            gShaderToy.mEffect.mPasses[i].mFrame = gShaderToy.mFpsFrame;
        }

        requestAnimationFrame(function() {
            gShaderToy.mTOffset = value;
            gShaderToy.mTo = getRealTime();
            gShaderToy.mTf = value;
            gShaderToy.mEffect.mAudioContext.currentTime = value;

            gShaderToy.pauseTime();
        });
    };

    /**
     * Updates ShaderToy inputs.
     */
    Timebar.prototype.updateInputs = function updateInputs(value) {
        gShaderToy.mEffect.mPasses.forEach(function mPass(pass) {
            pass.mInputs.forEach(function mInput(input){
                var media = null;
                if (input) {
                    media = input.audio || input.video;
                    if (media) {
                        media.controls = true;
                        media.currentTime = value / 1000;
                    }
                }
            });
        });
    };

    /**
     * Mouse uniform sliders constructor.
     */
    MouseUniforms = function() {
        this.config = [
            { gS: 'PosX', vPart: 'x', size: 'width'},
            { gS: 'PosY', vPart: 'y', size: 'height'},
            { gS: 'OriX', vPart: 'z', size: 'width'},
            { gS: 'OriY', vPart: 'w', size: 'height'}
        ];
        this.addSliders();
        this.onResize();
        window.addEventListener('resize', this.onResize.bind(this));
    };

    /**
     * Adds sliders to page.
     */
    MouseUniforms.prototype.addSliders = function() {
        this.slidersWrapper = document.createElement('div');
        this.slidersWrapper.classList.add('mouse-uniforms');

        this.sliders = this.config.map(function createSlider(obj) {
            var slider = document.createElement('input'),
                valueElement = document.createElement('span');

            slider.type = 'range';
            slider.min = 0;
            slider.value = 0;
            slider.setAttribute('data-axis', obj.gS);
            slider.setAttribute('data-vpart', obj.vPart);
            slider.setAttribute('data-size', obj.size);

            valueElement.textContent = obj.vPart + ': 0';
            this.slidersWrapper.appendChild(slider);
            this.slidersWrapper.appendChild(valueElement);

            slider.addEventListener('input', this.onSliderChange.bind(this));
            slider.addEventListener('blur', this.onSliderBlur);
            return slider;
        }, this);

        shaderToyElements.shaderInfo.insertBefore(
            this.slidersWrapper,
            document.getElementById('shaderInfoHeader')
        );
    };

    /**
     * Resets mouse left button status.
     */
    MouseUniforms.prototype.onSliderBlur = function() {
        gShaderToy.mMouseIsDown = false;
    };

    /**
     * Updates shaderToy mouse uniforms.
     * Waits 20ms to reset mouse button status.
     */
    MouseUniforms.prototype.onSliderChange = function(e) {
        var slider = e.target,
            axis = slider.getAttribute('data-axis'),
            vPart = slider.getAttribute('data-vPart'),
            value = slider.value;

        slider.nextSibling.textContent = vPart + ': ' + value;

        gShaderToy['mMouse' + axis] = value;
        gShaderToy.mForceFrame = true;
        setTimeout(this.onSliderBlur, 20);
    };

    /**
     * Updates sliders range on window resize.
     */
    MouseUniforms.prototype.onResize = function() {
        var sizes = document.getElementById('demogl').getBoundingClientRect();

        this.sliders.forEach(function(slider) {
            slider.max = sizes[slider.getAttribute('data-size')];
            this.onSliderChange({target: slider});
        }, this);
    };

    window.ToyPlug = new ToyPlug();


})(document, window);
