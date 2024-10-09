const only_num = /^[0-9.]+$/;
const only_num_replace = /[^0-9.]/g;
const email_reg = /^(([^<>()\[\]\\.,;:\s@"]{1,62}(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z-аА-яЯ\-0-9]+\.)+[a-zA-Z-аА-яЯ]{2,62}))$/;

const validationRules = {
    'email': {
        'rules': {
            regex: email_reg
        }
    },
    'numeric': {
        'rules': {
            regex: only_num
        }
    },
    'password': {
        'rules': {
            password: true
        }
    },
    'password_repeat': {
        'rules': {
            password_repeat: true
        }
    }
}

function formReset(form){
    if (typeof form.dataset.noReset !== 'undefined' || form.classList.contains('no-reset')) {
        return;
    }
    form.reset();
    form.querySelectorAll('.is-selected').forEach(item=>item.classList.remove('is-selected'))
    form.querySelectorAll('.image-preview').forEach(item=>item.remove())
    form.querySelectorAll('.ql-editor').forEach(item=>item.innerHTML = '')
    form.querySelectorAll('.is-visible').forEach(item=>item.classList.remove('is-visible'))

    form.querySelectorAll('.output_text').forEach(function (item) {
        let inputContainer = item.closest('.input')
        let defaultValue = inputContainer.querySelector('.is-default')
        let outValue = inputContainer.querySelector('.output_value')

        if(defaultValue){
            defaultValue.classList.add('is-selected')
        }

        if(item.nodeName.toLowerCase() === 'input') {
            item.value = defaultValue ? defaultValue.textContent.trim() : ''
        } else {
            item.textContent = defaultValue ? defaultValue.textContent.trim() : ''
        }
        outValue.value = defaultValue ? defaultValue.dataset.value : ''
    })
}
function ajaxSuccess(form, data){
    data = data['responseJSON'] || data['data'] || data
    let popupSuccess = form.dataset.successPopup;
    let formBtn = form.querySelector('[type="submit"]');
    let thisSection = form.closest('.show-hide-on-success') || form.closest('section') || form
    let showOnSuccess = thisSection.querySelector('.show-on-success')
    let hideOnSuccess = thisSection.querySelector('.hide-on-success')
    let redirectUrl = data["redirect_url"] || data["redirect"] || form.dataset.redirect

    if (form['ajaxSuccess']){
        form['ajaxSuccess'](form, data)
    }

    Fancybox.close();

    if (redirectUrl){
        window.location.href = redirectUrl;
        return;
    }
    if (formBtn){
        formBtn.removeAttribute('disabled');
    }

    if (popupSuccess) {
        Fancybox.show([{
            src: popupSuccess,
            type: 'inline',
            placeFocusBack: false,
            trapFocus: false,
            autoFocus: false
        }], {
            dragToClose: false
        });
    }
    if(hideOnSuccess){
        fadeOut(hideOnSuccess, 300, function () {
            if(showOnSuccess) {
                fadeIn(showOnSuccess, 300)
            }
        })
    } else if(showOnSuccess){
        fadeIn(showOnSuccess, 300)
    }

    formReset(form)
}
function ajaxError(form, data){
    data = data['responseJSON'] || data['data'] || data
    let formBtn = form.querySelector('[type="submit"]');
    let popupError = form.dataset.errorPopup;

    if (form['ajaxError']){
        form['ajaxError'](form, data)
    }

    Fancybox.close();

    if (formBtn) {
        formBtn.removeAttribute('disabled');
    }
    if(typeof data === 'object' && data['errors']){
        let scrolledToInput = false
        Object.keys(data['errors']).forEach(name => {
            let formInput = form.querySelector(`[name="${name}"]`)
            if(formInput && formInput['setError']) {
                formInput.setError(data['errors'][name])
                if(!scrolledToInput){
                    if(document.scrollTo) {
                        document.scrollTo(formInput, 700)
                    }
                    scrolledToInput = true;
                }
            }
        })
    }
    if (popupError) {
        Fancybox.show([{
            src: popupError,
            type: 'inline',
            placeFocusBack: false,
            trapFocus: false,
            autoFocus: false
        }], {
            dragToClose: false
        });
    }
}
function onSubmit(form, thisFormData = false) {
    let formData = thisFormData || new FormData(form);
    let action = form.getAttribute('action') || '/wp-admin/admin-ajax.php';
    let method = form.getAttribute('method') || 'post';
    let formBtn = form.querySelector('[type="submit"]');
    let editors = form.querySelectorAll('.ql-editor');
    let xhr = new XMLHttpRequest();

    if (editors.length) {
        editors.forEach(function(editor) {
            let thisName = editor.closest('[data-name]');
            editor.querySelectorAll('.ql-emojiblot').forEach(function(emoji){
                emoji.outerHTML = emoji.textContent
            })
            let thisValue = editor.innerHTML;
            if (!thisName) return;
            thisName = thisName.dataset.name;
            formData.append(thisName, thisValue);
        });
    }

    if (formBtn) {
        formBtn.setAttribute('disabled', 'disabled');
    }

    xhr.open(method, action);
    xhr.send(formData);
    xhr.onload = function() {
        let data = xhr.responseText
        try { data = JSON.parse(data) } catch (error) {}

        if (xhr.status === 200) {
            ajaxSuccess(form, data)
        } else {
            ajaxError(form, data)
        }
    };
}

function blocks() {
    let methods = {
        '.input--select': function() {
            dropdown({
                globalContainer: '',
                containerClass: 'input--select',
                btnSelector: '.output_text',
                closeBtnClass: '',
                dropdownSelector: '.input__dropdown',
                effect: 'fade',
                timing: 200
            });

            function selectItem(e) {
                let option = e.target;
                if(e['nodeName']) option = e;
                if(option.classList.contains('input__search') || option.querySelector('a')) return;
                let container = option.closest('.input--select');
                let text = container.classList.contains('output-html') ? option.innerHTML.trim() : option.textContent.trim();
                let value = option.dataset.value;
                let outText = container.querySelector('.output_text');
                let outValue = container.querySelector('.output_value');

                if(!container.classList.contains('no-output')) {
                    if(outText && text) {
                        if(outText.nodeName.toLowerCase() === 'input') {
                            outText.value = text;
                        } else {
                            outText.innerText = text;
                        }
                    }
                }
                if(outValue) {
                    outValue.value = value;
                    if(typeof outValue.isValid === 'function'){
                        outValue.isValid();
                    }
                    if(typeof trigger === 'function'){
                        trigger(outValue, 'change')
                    }
                }
                option.classList.add('is-selected');

                Array.from(option.parentElement.children).forEach(function (item) {
                    if(item != option){
                        item.classList.remove('is-selected')
                    }
                })

                if(!container.classList.contains('has-checkbox') && typeof trigger === 'function') {
                    trigger('close-dropdown')
                }
            }

            dynamicListener('click', '.input--select li', selectItem)
            dynamicListener('update', '.input--select .output_value', function(e) {
                let outInp = e.target
                let container = outInp.closest('.input')
                let findItem = container.querySelector(`[data-value="${outInp.value}"]`)
                if(findItem){
                    selectItem(findItem)
                }
            })

            document.querySelectorAll('.input--select .is-selected, .input--select .is-default').forEach(function(input) {
                selectItem(input);
            });
        },
        '.form': function (forms) {
            forms.forEach(function (form) {
                validate(form, {submitFunction: onSubmit})
            })
        },
    };
    Object.keys(methods).forEach(selector => {
        if (document.querySelector(selector)) {
            methods[selector](document.querySelectorAll(selector));
        }
    });
}

function offsetTop(el) {
    let thisOffset = 0
    while (true){
        if(!el.offsetParent || el.tagName.toLowerCase() === 'body') {
            break;
        }
        thisOffset += el.offsetTop
        el = el.offsetParent
    }
    return thisOffset;
}
function smoothScrollInit() {
    var requestAnimFrame = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();

    function scrollTo(to, duration = 1500, callback) {
        let headerEl = document.querySelector('.header')
        let headerHeight = 0

        if (!isDomElement(to)) {
            to = document.querySelector(to)
        }
        if(!to){
            return;
        }
        to = offsetTop(to);

        function move(amount) {
            document.documentElement.scrollTop = amount;
            document.body.parentNode.scrollTop = amount;
            document.body.scrollTop = amount;
        }

        if(headerEl){
            let headerStyles = getComputedStyle(headerEl)

            if(headerStyles.position === 'sticky' || headerStyles.position === 'fixed'){
                headerHeight = headerEl.offsetHeight
            }
        }
        var start = window.scrollY,
            change = (to - headerHeight) - start,
            currentTime = 0,
            increment = 20;

        var animateScroll = function() {
            currentTime += increment;
            var val = Math.easeInOutQuad(currentTime, start, change, duration);
            move(val);
            if (currentTime < duration) {
                requestAnimFrame(animateScroll);
            }
            else {
                if (callback && typeof(callback) === 'function') {
                    callback();
                }
            }
        };

        animateScroll();
    }

    Math.easeInOutQuad = function(t, b, c, d) {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t + b
        }
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    Math.easeInCubic = function(t, b, c, d) {
        var tc = (t /= d) * t * t;
        return b + c * (tc);
    };

    Math.inOutQuintic = function(t, b, c, d) {
        var ts = (t /= d) * t,
            tc = ts * t;
        return b + c * (6 * tc * ts + -15 * ts * ts + 10 * tc);
    };

    function isDomElement(obj) {
        return obj instanceof Element;
    }

    document.scrollTo = scrollTo

    if(document.location.hash){
        window.scrollTo(0, 0);
        document.scrollTo(document.location.hash)
    }
}
function anchors() {
    document.querySelectorAll('a[href^="#"]:not([data-fancybox])').forEach(anchor => {
        if(anchor.getAttribute('href').length <= 1 || !document.querySelector(anchor.getAttribute('href'))){
            return;
        }
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.scrollTo(this.getAttribute('href'), 700)
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    blocks();
    smoothScrollInit()
    anchors()
    Fancybox.bind('[data-fancybox]', {
        dragToClose: false
    });
});

// Fancybox.show([{
//     src: '#modal_error',
//     type: 'inline',
//     placeFocusBack: false,
//     trapFocus: false,
//     autoFocus: false,
//   }], {
//     dragToClose: false,
//     on: {
//       "destroy": (event, fancybox, slide) => {
//         clearTimeout(closeTimeout)

//         if(activePopup){
//           openPopup(false, activePopup)
//         }
//       },
//     }
// });

function fadeIn(el, timeout, display) {
    let afterFunc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    el.style.opacity = 0;
    el.style.display = display || 'block';
    el.style.transition = `opacity ${timeout}ms`;
    setTimeout(() => {
        el.style.opacity = 1;
        setTimeout(function () {
            if (afterFunc) {
                afterFunc(el);
            }
        }, timeout);
    }, 10);
}
function fadeOut(el, timeout) {
    let afterFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    el.style.opacity = 1;
    el.style.transition = `opacity ${timeout}ms`;
    el.style.opacity = 0;
    setTimeout(() => {
        el.style.display = 'none';
        if (afterFunc) {
            afterFunc(el);
        }
    }, timeout);
}





document.querySelectorAll('[data-tab-btn]').forEach(function (button) {
    button.addEventListener('click', function () {
        if (this.classList.contains('active')) {
            return;
        }

        let elseBtn = document.querySelector('.active[data-tab-btn]');
        if (elseBtn) {
            elseBtn.classList.remove('active');
        }
        this.classList.add('active');

        let thisTab = document.querySelector('[data-tab="' + this.getAttribute('data-tab-btn') + '"]');
        let elseTab = document.querySelector('.active[data-tab]');

        if (!elseTab) {
            thisTab.classList.add('active');
            return;
        }

        thisTab.classList.add('active');
        elseTab.classList.remove('active');

        fadeOut(elseTab, 300, function () {
            fadeIn(thisTab, 300, "block");
        });
    });
});

// Add event listeners for the forward and backward buttons
document.getElementById('prevBtn').addEventListener('click', function () {
    let activeBtn = document.querySelector('.active[data-tab-btn]');
    let prevBtn = activeBtn.previousElementSibling || document.querySelector('[data-tab-btn]:last-child');
    prevBtn.click();
});

document.getElementById('nextBtn').addEventListener('click', function () {
    let activeBtn = document.querySelector('.active[data-tab-btn]');
    let nextBtn = activeBtn.nextElementSibling || document.querySelector('[data-tab-btn]:first-child');
    nextBtn.click();
});

// Trigger click on the first tab button to initialize the active tab
document.querySelector('[data-tab-btn]').click();