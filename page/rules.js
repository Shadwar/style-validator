'use strict';

var STYLEV = STYLEV || {};

STYLEV.RULES = {

	execute: function() {
		var that = STYLEV.RULES;

		that.setParameters();
		that.applyFromLocalStorage();
		that.insertDummyElements();
		that.getAllCSSProperties();
		that.setCSSPropertyDataList();
		that.removeSaveButtonWhenNotLocal();
		that.initializeRuleArea();
		that.adjustPosition();
	},
	initializeRuleArea: function() {
		var that = STYLEV.RULES;

		that.rulesList.innerHTML = '';

		that.json2html()
			.then(function() {
				that.removeLoadingSpinner();
				that.setParametersAfterAdding();
				that.bindEvents();
				that.resizeTextareaBasedOnLine();
				that.toggleReason();
				that.toggleReferenceURL();
				that.toggleDisplayMode();
				that.searchProperty();
				STYLEV.VALIDATOR.setStyleDataBySelectors();
				that.isShowedAllAtFirst = true;
			});
	},
	setParameters: function() {
		var that = STYLEV.RULES;

		that.wrapper = document.querySelector('.wrapper');
		that.mainHeader = document.querySelector('.main-header');
		that.isShowedAllAtFirst = false;
		that.resetButton = document.querySelector('#reset-button');
		that.addButton = document.querySelector('#add-button');
		that.saveButton = document.querySelector('#save-button');
		that.downloadButton = document.querySelector('#download-button');
		that.datalistOfProperties = document.querySelector('#all-css-properties');
		that.rulesList = document.querySelector('#rules-list');
		that.templatePropertyBase = document.querySelector('#template-property-base').content;
		that.templatePropertyNg = document.querySelector('#template-property-ng').content;
		that.templateRule = document.querySelector('#template-rule').content;
		that.dummyElementWrapper = document.createElement('div');
		that.dummyElementWrapper.classList.add('dummy-wrapper');
		that.dummyElement4detectWidth = document.createElement('div');
		that.dummyElement4detectWidth.id = 'dummy-element-4-detect-width';
		that.dummyElement4detectWidth.classList.add('dummy');
		that.dummyElement4testStyle = document.createElement('div');
		that.dummyElement4testStyle.id = 'dummy-element-4-test-style';
		that.dummyElement4testStyle.classList.add('dummy');
		that.reasonCheckbox = document.querySelector('#reason-checkbox');
		that.referenceURLCheckbox = document.querySelector('#reference-url-checkbox');
		that.searchPropertyInput = document.querySelector('#search-property-input');
		that.searchedRulesCount = document.querySelector('#searched-rules-count');
		that.totalRulesCount = document.querySelector('#total-rules-count');
		that.displayModeLList = document.querySelector('#display-mode-list');
		that.displayListMode = document.querySelector('#display-list-mode');
		that.displayColumnMode = document.querySelector('#display-column-mode');

		that.allCSSProperties = [];
		that.INPUT_ARROW_WIDTH = 22;

		that.each = STYLEV.METHODS.each;
	},
	applyFromLocalStorage: function() {
		var that = STYLEV.RULES;
		that.reasonCheckboxData = localStorage.getItem(that.reasonCheckbox.id);
		that.reasonCheckbox.checked = that.reasonCheckboxData ? that.reasonCheckboxData === 'true' : that.reasonCheckbox.checked;
		that.referenceURLCheckboxData = localStorage.getItem(that.referenceURLCheckbox.id);
		that.referenceURLCheckbox.checked = that.referenceURLCheckboxData ? that.referenceURLCheckboxData === 'true' : that.referenceURLCheckbox.checked;
	},
	setParametersAfterAdding: function() {
		var that = STYLEV.RULES;

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li');
		that.typeSelects = that.rulesList.querySelectorAll('.type-select');
		that.stylesLists = that.rulesList.querySelectorAll('.styles-list');
		that.textInputs = that.rulesList.querySelectorAll('.text-input');

		that.reasons = that.rulesList.querySelectorAll('.reason');
		that.cssProperties = that.rulesList.querySelectorAll('.css-property');
	},
	setParametersAfterToggledProperty: function() {
		var that = STYLEV.RULES;

		that.reasons = that.rulesList.querySelectorAll('.reasons');
	},
	bindEvents: function() {
		var that = STYLEV.RULES;

		that.resetButton.addEventListener('click', that.initializeRuleArea);
		that.addButton.addEventListener('click', that.addRule);
		that.saveButton.addEventListener('click', that.saveJSON);
		that.downloadButton.addEventListener('mousedown', that.setDownloadButton);
		that.reasonCheckbox.addEventListener('change', that.toggleReason);
		that.referenceURLCheckbox.addEventListener('change', that.toggleReferenceURL);
		window.addEventListener('resize', that.resizeTextareaBasedOnLine);
		window.addEventListener('resize', that.adjustPosition);
		that.searchPropertyInput.addEventListener('keyup', that.searchProperty);
		that.displayListMode.addEventListener('change', that.toggleDisplayMode);
		that.displayColumnMode.addEventListener('change', that.toggleDisplayMode);

		that.bind2RuleListItem();
		that.bind2StylesList();
	},

	toggleDisplayMode: function(event) {
		var that = STYLEV.RULES;
		var valueFromEvent = event && event.currentTarget.value;
		var valueFromLS = localStorage.getItem(that.rulesList.id);
		var displayMode = valueFromEvent || valueFromLS;

		switch(displayMode) {
			case 'column':
				that.rulesList.classList.remove('rules-list-list');
				break;
			case 'list':
				that.rulesList.classList.add('rules-list-list');
				break;
			default:
				break;
		}

		if(valueFromEvent) {
			localStorage.setItem(that.rulesList.id, displayMode);
		}

		//init
		if(!valueFromEvent && valueFromLS) {
			that.displayListMode.checked = displayMode === 'list';
			that.displayColumnMode.checked = displayMode === 'column';
		}

	},

	searchProperty: function(event) {
		var that = STYLEV.RULES;
		var rulesListItems = that.rulesListItems;
		var rulesListItemsLen = rulesListItems.length;
		var inputValue = that.searchPropertyInput.value;
		var count = 0;
		that.totalRulesCount.textContent = rulesListItemsLen + '';

		if(inputValue) {

			that.each(rulesListItems, function(rulesListItem) {
				var cssProperties = rulesListItem.querySelectorAll('.css-property');
				var hasWord = false;

				that.each(cssProperties, function(cssProperty) {
					var cssPropertyValue = cssProperty.value;

					if(cssPropertyValue.indexOf(inputValue) !== -1) {
						hasWord = true;
						return 'break';
					}
				});

				if(hasWord) {
					count = (count+1)|0;
					rulesListItem.classList.remove('hidden');
				} else {
					rulesListItem.classList.add('hidden');
				}
			});

			that.searchedRulesCount.textContent = count;

		} else {
			that.each(rulesListItems, function(rulesListItem) {
				rulesListItem.classList.remove('hidden');
			});

			that.searchedRulesCount.textContent = rulesListItemsLen + '';
		}
	},

	toggleReason: function(event) {
		var that = STYLEV.RULES;
		var reasons = that.rulesList.querySelectorAll('.reason');
		that.each(reasons, function(reason) {
			reason.hidden = !that.reasonCheckbox.checked;
		});
		localStorage.setItem(that.reasonCheckbox.id, that.reasonCheckbox.checked);
	},

	toggleReferenceURL: function(event) {
		var that = STYLEV.RULES;
		var referenceURLs = that.rulesList.querySelectorAll('.reference-url');
		that.each(referenceURLs, function(referenceURL) {
			referenceURL.hidden = !that.referenceURLCheckbox.checked;
		});
		localStorage.setItem(that.referenceURLCheckbox.id, that.referenceURLCheckbox.checked);
	},

	removeSaveButtonWhenNotLocal: function() {
		var that = STYLEV.RULES;
		if(location.hostname === 'style-validator.io') {
			that.saveButton.hidden = true;
		}
	},
	
	setDownloadButton: function() {
		var that = STYLEV.RULES;
		var json = that.generateJSON();
		this.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, '\t'));
		alert('Download and replace file which named rules.json without rename the file');
	},

	bind2RuleListItem: function(rulesListItem) {
		var that = STYLEV.RULES;
		
		function findAndBind(rulesListItem) {
			var editButton = rulesListItem.querySelector('.edit-button');
			var removeButton = rulesListItem.querySelector('.remove-button');
			editButton.addEventListener('click', that.toggleEditMode);
			removeButton.addEventListener('click', that.removeTheRule);
		}

		if(rulesListItem) {
			findAndBind(rulesListItem);
		} else {
			that.each(that.rulesListItems, findAndBind);
		}
	},

	toggleEditMode: function(event) {
		var that = STYLEV.RULES;

		event.stopPropagation();
		event.preventDefault();

		var target = event.currentTarget || event.target;
		var rulesListItem = that.closest(target, 'li[data-ruleid]');
		var isEditMode = rulesListItem.classList.contains('edit-mode');

		function reset() {
			that.modifyBasedOnCurrentData(rulesListItem);
			rulesListItem.classList.remove('edit-mode');
			event.currentTarget.textContent = 'Edit';

		}

		function showAll() {
			var stylesLists = rulesListItem.querySelectorAll('.styles-list');
			rulesListItem.classList.add('edit-mode');
			event.currentTarget.textContent = 'Set';
			that.each(stylesLists, function(stylesList) {
				stylesList.classList.remove('hidden');
			});
		}

		if(isEditMode) {
			reset();
		} else {
			showAll();
		}
	},

	modifyBasedOnCurrentData: function(rulesListItem) {
		var that = STYLEV.RULES;

		var formPartsWrappers = rulesListItem.querySelectorAll('.styles-list, .text-input, .type-select');

		that.each(formPartsWrappers, function(formPartsWrapper) {
			var hasData = false;

			var inputs = formPartsWrapper.querySelectorAll('input, select, textarea');
			if(inputs === null) {
				hasData = false;
				return 'break';
			}
			that.each(inputs, function(input) {
				if(input.value) {
					hasData = true;
					return 'break';
				}
			});

			if(hasData) {
				formPartsWrapper.classList.remove('hidden');
			} else {
				formPartsWrapper.classList.add('hidden');
			}
		});
	},

	removeTheRule: function(event) {
		var that = STYLEV.RULES;
		event.stopPropagation();
		event.preventDefault();

		var rulesListItem = that.closest(event.currentTarget, 'li');

		if(confirm('Are you sure you want to remove this rule?')) {
			rulesListItem.parentElement.removeChild(rulesListItem);
		}
	},

	bind2StylesList: function(stylesLists) {
		var that = STYLEV.RULES;

		that.stylesLists = stylesLists ? stylesLists : that.stylesLists;

		that.each(that.stylesLists, function(stylesList) {
			stylesList.addEventListener('focus', that.insertProperty);
		});
	},
	addRule: function() {
		var that = STYLEV.RULES;
		var clone = document.importNode(that.templateRule, true);
		var ruleListItem = clone.querySelector('li');
		var stylesLists = clone.querySelectorAll('.styles-list');
		ruleListItem.classList.add('edit-mode');
		that.bind2RuleListItem(ruleListItem);
		that.bind2StylesList(stylesLists);
		that.rulesList.insertBefore(clone, that.rulesList.querySelector(':scope > li'));
		that.rulesList.querySelector(':scope > li').querySelector('input').focus();
		that.setParametersAfterAdding();
	},
	insertDummyElements: function() {
		var that = STYLEV.RULES;

		document.documentElement.appendChild(that.dummyElementWrapper);
		that.dummyElementWrapper.appendChild(that.dummyElement4detectWidth);
		that.dummyElementWrapper.appendChild(that.dummyElement4testStyle);
	},
	insertProperty: function(event, stylesList, property, propertyValue, reason, referenceURL) {

		var that = STYLEV.RULES;
		var stylesList = stylesList || event.currentTarget || event.target;
		var isBaseStyles = stylesList.dataset.id === 'base-styles';

		var clone = null;

		if(isBaseStyles) {
			clone = document.importNode(that.templatePropertyBase, true);
		} else {
			clone = document.importNode(that.templatePropertyNg, true);
		}

		if(property) {
			clone.querySelector('.css-property').value = property;
		}
		if(propertyValue) {
			clone.querySelector('.css-property-value').value = propertyValue;
		}

		if(!isBaseStyles) {
			if(reason) {
				clone.querySelector('.reason').value = reason;
			}
			if(referenceURL) {
				clone.querySelector('.reference-url').value = referenceURL;
			}
		}

		stylesList.appendChild(clone);

		var appendedStylesListItem = stylesList.querySelector(':scope > li:last-child');
		that.doAfterInsertingProperty(appendedStylesListItem, isBaseStyles);

		return appendedStylesListItem;
	},

	jump2urlOfValue: function(event) {
		location.href = event.currentTarget.value;
	},

	doAfterInsertingProperty: function(appendedStylesListItem, isBaseStyles) {
		var that = STYLEV.RULES;
		var cssProperty = appendedStylesListItem.querySelector('.css-property');
		var cssPropertyValue = appendedStylesListItem.querySelector('.css-property-value');
		that.bindEvents2ListItem(appendedStylesListItem);
		that.bindEvents2CSSPropertyAndValue(cssProperty, cssPropertyValue);

		if(!isBaseStyles) {

			var reason = appendedStylesListItem.querySelector('.reason');
			var referenceURL = appendedStylesListItem.querySelector('.reference-url');
			that.bindEvents2Textarea(reason);
			that.bindEvents2ReferenceURL(referenceURL);
		}

		cssProperty.focus();

		if(that.isShowedAllAtFirst) {
			that.setParametersAfterToggledProperty();
		}
	},
	bindEvents2ReferenceURL: function(referenceURL) {
		var that = STYLEV.RULES;
		referenceURL.addEventListener('dblclick', that.jump2urlOfValue);
		referenceURL.addEventListener('keyup', that.insertPropertyByEnterKey);
	},

	bindEvents2ListItem: function(appendedStylesListItem) {
		var that = STYLEV.RULES;
		var inputs = appendedStylesListItem.querySelectorAll('input, textarea');

		appendedStylesListItem.addEventListener('click', that.stopPropagation);

		that.each(inputs, function(input) {
			input.addEventListener('focus', that.selectOnFocus);
			input.addEventListener('click', that.stopPropagation);
			input.addEventListener('keyup', that.fireBlurEventByEscKey);
			input.addEventListener('keyup', that.moveFocusByEnter);
		});
	},
	bindEvents2CSSPropertyAndValue: function(cssProperty, cssPropertyValue) {
		var that = STYLEV.RULES;

		cssProperty.addEventListener('input', that.modifyCSSProperty);
		cssProperty.addEventListener('focus', that.applySameStyles2dummyElem);
		cssProperty.addEventListener('blur', that.applyValidationResult);

		cssPropertyValue.addEventListener('input', that.modifyCSSPropertyValue);
		cssPropertyValue.addEventListener('focus', that.applySameStyles2dummyElem);
		cssPropertyValue.addEventListener('blur', that.applyValidationResult);


	},
	modifyCSSProperty: function(event, stylesListItem) {
		var that = STYLEV.RULES;

		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssProperty.value;
		cssProperty.style.setProperty('width', (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px', 'important');
		that.validateProperty(cssProperty);
		that.validatePropertyValue(cssProperty, cssPropertyValue);

	},
	modifyCSSPropertyValue: function(event, stylesListItem) {
		var that = STYLEV.RULES;

		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');

		that.dummyElement4detectWidth.innerHTML = cssPropertyValue.value;
		cssPropertyValue.style.width = (that.dummyElement4detectWidth.offsetWidth * 1.05 + that.INPUT_ARROW_WIDTH) + 'px';
		that.validatePropertyValue(cssProperty, cssPropertyValue);
	},
	fireBlurEventByEscKey: function(event) {
		var escKeyCode = 27;

		if(event.keyCode === escKeyCode) {
			event.currentTarget.blur();
		}
	},
	moveFocusByEnter: function(event) {
		var that = STYLEV.RULES;
		var stylesListItem = that.closest(event.currentTarget, 'li');
		var inputs = stylesListItem.querySelectorAll('input, textarea');
		var enterKeyCode = 13;

		if(event.keyCode === enterKeyCode) {
			that.each(inputs, function(input) {
				var nextInput = inputs[i+1];
				if(nextInput !== null && input.isEqualNode(event.currentTarget)) {
					nextInput.focus();
				}
			});
		}
	},
	insertPropertyByEnterKey: function(event) {
		var that = STYLEV.RULES;

		var stylesListItem = that.closest(event.currentTarget, 'li');
		var stylesList = stylesListItem.parentElement;
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');
		var enterKeyCode = 13;

		if(event.keyCode === enterKeyCode) {

			if(!cssProperty.value || !cssPropertyValue.value) {
				that.removeProperty(stylesList, stylesListItem);
			} else {
				that.insertProperty(null, stylesList);
			}
		}
	},
	validateProperty: function(cssProperty) {
		var that = STYLEV.RULES;

		var _cssProperty = cssProperty.value;
		var isValid = false;

		that.each(that.allCSSProperties, function(cssPropertyFromData) {
			if(_cssProperty === cssPropertyFromData) {
				isValid = true;
				return 'break';
			}
		});
		cssProperty.dataset_isvalid = isValid ? 'true' : 'false';

	},

	validatePropertyValue: function(cssProperty, cssPropertyValue) {

		var that = STYLEV.RULES;
		var property = cssProperty.value;
		var propertyValue = cssPropertyValue.value;

		//TODO: 用途を考える
		var isReverse = propertyValue.indexOf('!') === 0;
		propertyValue = propertyValue.replace('!', '');

		var hasGroupOperator = propertyValue.match(/^\[(.+)\]$/);
		propertyValue = hasGroupOperator ? hasGroupOperator[1] : propertyValue;

		var hasOrOperator = propertyValue.split('|').length > 1;

		//TODO: !は不要かも
		var regexOkOriginalKeyWords = new RegExp(' default | !default | 0 | !0 | over-0 | under-0 | inherit | !inherit ');

		if(hasOrOperator) {

			var separatedPropertyValues = propertyValue.split('|');
			var isValidOfGroupValue = true;

			that.each(separatedPropertyValues, function(separatedPropertyValue) {

				that.dummyElement4testStyle.style.setProperty(property, separatedPropertyValue, '');

				var computedValue = STYLEV.VALIDATOR.getStyle(that.dummyElement4testStyle, property, separatedPropertyValue);
				that.dummyElement4testStyle.style.setProperty(property, null, '');

				var isValid = separatedPropertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + separatedPropertyValue + ' ');

				if(!isValid) {
					isValidOfGroupValue = false;
					return 'break';
				}
			});

			cssPropertyValue.dataset_isvalid = isValidOfGroupValue ? 'true' : 'false';

		} else {

			that.dummyElement4testStyle.style.setProperty(property, propertyValue, '');

			var computedValue = STYLEV.VALIDATOR.getStyle(that.dummyElement4testStyle, property, propertyValue);
			that.dummyElement4testStyle.style.setProperty(property, null, '');

			var isValid = propertyValue === computedValue || regexOkOriginalKeyWords.test(' ' + propertyValue + ' ');

			cssPropertyValue.dataset_isvalid = isValid ? 'true' : 'false';

		}
	},
	applyValidationResult: function(event, stylesListItem) {

		var that = STYLEV.RULES;
		var stylesListItem = stylesListItem || that.closest(event.currentTarget, 'li');
		var cssProperty = stylesListItem.querySelector('.css-property');
		var cssPropertyValue = stylesListItem.querySelector('.css-property-value');
		var stylesList = stylesListItem.parentElement;

		if(!cssProperty.value && !cssPropertyValue.value) {

			that.removeProperty(stylesList, stylesListItem);

		} else {

			if(event && event.currentTarget) {

				event.currentTarget.style.setProperty('margin-right',(-that.INPUT_ARROW_WIDTH) + 'px', '');
				setTimeout(that.updateValidClass, 0, event.currentTarget);

			} else {

				cssProperty.style.setProperty('margin-right', (-that.INPUT_ARROW_WIDTH) + 'px', '');
				cssPropertyValue.style.setProperty('margin-right', (-that.INPUT_ARROW_WIDTH) + 'px', '');
				setTimeout(that.updateValidClass, 0, cssProperty);
				setTimeout(that.updateValidClass, 0, cssPropertyValue);
			}

		}
	},
	updateValidClass: function(target) {
		if(target && target.value) {
			if(target.dataset_isvalid === 'true') {
				target.classList.remove('invalid');
				target.classList.add('valid');
			} else {
				target.classList.remove('valid');
				target.classList.add('invalid');
			}
		}
	},
	setCSSPropertyDataList: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();
		that.each(that.allCSSProperties, function(cssProperty) {
			var option = new Option(cssProperty, cssProperty);
			df.appendChild(option);
		});
		that.datalistOfProperties.appendChild(df);
	},
	stopPropagation: function() {
		event.stopPropagation();
	},
	applySameStyles2dummyElem: function(event) {
		var that = STYLEV.RULES;
		var currentTarget = event.currentTarget;
		that.dummyElement4detectWidth.innerHTML = currentTarget.value;
		that.dummyElement4detectWidth.style['font-size'] = getComputedStyle(currentTarget, '').getPropertyValue('font-size');
		that.dummyElement4detectWidth.style['font-family'] = getComputedStyle(currentTarget, '').getPropertyValue('font-family');
	},
	selectOnFocus: function(event) {
		event.currentTarget.select();
	},
	removeProperty: function(stylesList, stylesListItem) {
		var that = STYLEV.RULES;
		stylesList.removeChild(stylesListItem);
		that.setParametersAfterToggledProperty();
	},
	getAllCSSProperties: function() {
		var that = STYLEV.RULES;
		var cssProperties = document.documentElement.style;

		that.each(cssProperties, function(cssProperty) {

			if( cssProperty === 'cssFloat') {
				cssProperty = 'float';
			}

			if( cssProperty === 'cssText' ||
				cssProperty === 'parentRule' ||
				cssProperty === 'length' ||
				cssProperty === '0' ||
				cssProperty === 'all'
				) {
				return 'continue';
			}
			that.allCSSProperties.push(that.camel2Hyphen(cssProperty));
		});
	},
	camel2Hyphen: function(string) {
		// for Unicode transforms, replace [A-Z] with \p{Lu} if available
		return string
			.replace(/^[A-Z]/g, function(letter) {
				return letter.toLowerCase();
			})
			.replace(/[A-Z]/g, function(letter) {
				return '-'+letter.toLowerCase();
			});
	},
	json2html: function() {
		var that = STYLEV.RULES;
		var df = document.createDocumentFragment();

		return new Promise(function(resolve, reject) {

			that.getURL('../extension/data/rules.json')
				.then(JSON.parse)
				.then(function(jsonArray) {

					that.each(jsonArray, function(rule) {

						var ngStyles = rule['ng-styles'];

						var clone = document.importNode(that.templateRule, true);
						var ruleListItem = clone.querySelector('li');
						var typeSelects = clone.querySelectorAll('.type-select');
						var stylesLists = clone.querySelectorAll('.styles-list');
						var stylesListsBase = clone.querySelectorAll('.styles-list-base');
						var stylesListsNg = clone.querySelectorAll('.styles-list-ng');
						var textInputs = clone.querySelectorAll('.text-input');

						if(rule['rule-id'] !== undefined) {
							ruleListItem.dataset.ruleid = rule['rule-id'];
						}

						that.each(typeSelects, function(typeSelect) {
							typeSelect.querySelector('select').tabIndex = 1;
							that.applyData2HTML(typeSelect, rule, typeSelect.dataset.id);
						});
						that.each(stylesListsBase, function(stylesListBase) {
							stylesListBase.tabIndex = 1;
							that.applyData2HTML(stylesListBase, rule, stylesListBase.dataset.id);
						});
						that.each(stylesListsNg, function(stylesListNg) {
							stylesListNg.tabIndex = 1;
							that.applyData2HTML(stylesListNg, ngStyles, stylesListNg.dataset.id);
						});
						that.each(textInputs, function(textInput) {
							textInput.querySelector('input').tabIndex = 1;
							that.applyData2HTML(textInput, rule, textInput.dataset.id);
						});

						df.appendChild(clone);
					});

					that.rulesList.appendChild(df);

					resolve();

				});
		});
	},

	applyData2HTML: function(target, rule, id) {
		var that = STYLEV.RULES;
		var ruleStyles = rule && rule[id];

		if(ruleStyles) {

			if(target.classList.contains('type-select')) {

				var select = target.querySelector('select');
				select.value = ruleStyles;

			}
			if(target.classList.contains('styles-list')) {

				that.each(ruleStyles, function(cssProperty, cssPropertyValue) {

					var reason;
					var referenceURL;
					if(cssPropertyValue instanceof Array) {
						referenceURL = cssPropertyValue[2];
						reason = cssPropertyValue[1];
						cssPropertyValue = cssPropertyValue[0];
					}

					var stylesListItem = that.insertProperty(null, target, cssProperty, cssPropertyValue, reason, referenceURL);
					that.modifyCSSProperty(null, stylesListItem);
					that.modifyCSSPropertyValue(null, stylesListItem);
					that.applyValidationResult(null, stylesListItem);
				});
			}
			if(target.classList.contains('text-input')) {
				var input = target.querySelector('input');
				input.value = ruleStyles;

			}


		} else {

			target.classList.add('hidden');
		}
	},

	generateJSON: function() {
		var that = STYLEV.RULES;
		var jsonArray = [];
		
		//TODO: Need to receive `lastRuleID` from database on server
		var localLastRuleID = localStorage.getItem('lastRuleID');
		that.lastRuleID = (localLastRuleID && parseInt(localLastRuleID, 10)) || 0;

		that.rulesListItems = that.rulesList.querySelectorAll(':scope > li');

		that.each(that.rulesListItems, function(rulesListItem, i) {

			var rule = {};

			var ruleIDFromElem = rulesListItem.dataset.ruleid;

			if(ruleIDFromElem === undefined) {

				that.lastRuleID = (that.lastRuleID+1)|0;

				rule['rule-id'] = that.lastRuleID;
				rulesListItem.dataset.ruleid = that.lastRuleID;

			} else {

				rule['rule-id'] = that.lastRuleID = parseInt(ruleIDFromElem, 10);
			}

			var dataElements = rulesListItem.querySelectorAll('.styles-list, .text-input, .type-select');

			that.each(dataElements, function(dataElement) {

				var ruleType = dataElement.dataset.id;

				if(dataElement.classList.contains('type-select')) {

					var typeSelect = dataElement;

					var typeSelectItem = typeSelect.querySelector('select');

					if(typeSelectItem.value) {
						rule[ruleType] = typeSelectItem.value;
					}
				}

				if(dataElement.classList.contains('styles-list-base')) {

					var stylesListItems = dataElement.querySelectorAll(':scope > li');

					if(!stylesListItems.length) {
						return 'continue';
					}
					rule[ruleType] = {};

					that.each(stylesListItems, function(stylesListItem) {

						var property = stylesListItem.querySelector('.css-property');
						var propertyValue = stylesListItem.querySelector('.css-property-value');

						//TODO: 検証が通っていないものも入れるようにしているが、後々ベストな振る舞いについて考える
//						if (
//							property.dataset_isvalid === 'true' &&
//							propertyValue.dataset_isvalid === 'true'
//						) {

						rule[ruleType][property.value] = propertyValue.value;
//						}
					});
				}
				if(dataElement.classList.contains('styles-list-ng')) {

					var stylesListItems = dataElement.querySelectorAll(':scope > li');

					if(!stylesListItems.length) {
						return 'continue';
					}
					rule['ng-styles'] = rule['ng-styles'] || {};
					rule['ng-styles'][ruleType] = {};

					that.each(stylesListItems, function(stylesListItem) {

						var property = stylesListItem.querySelector('.css-property');
						var propertyValue = stylesListItem.querySelector('.css-property-value');
						var reason = stylesListItem.querySelector('.reason');
						var referenceURL = stylesListItem.querySelector('.reference-url');

						rule['ng-styles'][ruleType][property.value] = [];
						rule['ng-styles'][ruleType][property.value][0] = propertyValue.value;
						rule['ng-styles'][ruleType][property.value][1] = reason.value;
						rule['ng-styles'][ruleType][property.value][2] = referenceURL.value;
					});
				}

				if(dataElement.classList.contains('text-input')) {

					var textInput = dataElement;

					var textInputItem = textInput.querySelector('input');

					if(textInputItem.value) {
						rule[ruleType] = textInputItem.value;
					}
				}
			});

			jsonArray.push(rule);
		});

		//TODO: Need to send `lastRuleID` to server 
		//do ajax
		
		localStorage.setItem('lastRuleID', that.lastRuleID);
		
		return jsonArray;
	},
	getURL: function(url) {

		return new Promise(function (resolve, reject) {

			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onload = function () {
				if (xhr.status === 200) {
					resolve(xhr.responseText);
				} else {
					reject(new Error(xhr.statusText));
				}
			};
			xhr.onerror = function () {
				reject(new Error(xhr.statusText));
			};
			xhr.send();
		});
	},
	saveJSON: function() {
		var that = STYLEV.RULES;

		var xhr = new XMLHttpRequest();
		var apiURI = 'http://localhost:8001/saveJSON';
		var method = 'POST';
		var json = that.generateJSON();
		var data4send = JSON.stringify(json, null, '\t');

		xhr.open(method, apiURI, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.addEventListener('load', function () {
			if (xhr.status === 200) {
				that.showSuccessMsg();
			} else {
				that.showErrorMsg();
			}
		});
		xhr.addEventListener('error', that.showErrorMsg);

		if (xhr.readyState == 4) {
			return;
		}

		xhr.send(data4send);
	},
	showSuccessMsg: function() {
		alert('Saving of rules was successful! Let\'s send Pull Request!');
	},
	showErrorMsg: function() {
		alert('Could not connect to api server. Connect to api server, or click download button.');
	},

	parseSelector: function (selector) {

		var isCorrectParameters = typeof selector === 'string';

		if(!isCorrectParameters) {
			try {
				throw new Error('Bad Parameter!');
			} catch (e) {
				alert(e.name + ": " + e.message);
			}
		}

		var parsedSelectorObj = {
			tags: [],
			ids: [],
			classes: [],
			attributes: []
		};
		selector.split(/(?=\.)|(?=#)|(?=\[)/).forEach(function(token){
			switch (token[0]) {
				case '#':
					parsedSelectorObj.ids.push(token.slice(1));
					break;
				case '.':
					parsedSelectorObj.classes.push(token.slice(1));
					break;
				case '[':
					parsedSelectorObj.attributes.push(token.slice(1,-1).split('='));
					break;
				default :
					parsedSelectorObj.tags.push(token);
					break;
			}
		});
		return parsedSelectorObj;
	},

	closest: function(element, selector) {

		var that = STYLEV.RULES;
		var isCorrectParameters = element && element.nodeType === 1 && selector && typeof selector === 'string';
		if(!isCorrectParameters) {
			return null;
		}
		var parsedSelectorObj = that.parseSelector(selector);

		function isMatchedSelector(targetElement) {

			var isMatchedWithTags = true;
			var isMatchedWithIDs = true;
			var isMatchedWithClasses = true;
			var isMatchedWithAttributes = true;

			that.each(parsedSelectorObj.tags, function(value) {
				if(targetElement.tagName.toLowerCase() !== value) {
					isMatchedWithTags = false;
				}
			});

			that.each(parsedSelectorObj.ids, function(value) {
				if(targetElement.id !== value) {
					isMatchedWithIDs = false;
				}
			});

			that.each(parsedSelectorObj.classes, function(value) {
				if(!targetElement.classList.contains(value)) {
					isMatchedWithClasses = false;
				}
			});

			that.each(parsedSelectorObj.attributes, function(value) {
				var hasAttributeNameOnly = value.length === 1;
				var attributeName = value[0];
				if(hasAttributeNameOnly) {
					if(!targetElement.hasAttribute(attributeName)) {
						isMatchedWithAttributes = false;
					}
				} else {
					var attributeValue = value[1];
					if(targetElement.getAttribute(attributeName) !== attributeValue) {
						isMatchedWithAttributes = false;
					}
				}
			});
			return isMatchedWithTags && isMatchedWithIDs && isMatchedWithClasses && isMatchedWithAttributes;
		}

		element = element.parentElement;

		while(element && !isMatchedSelector(element)) {
			element = element.parentElement;
		}

		return element;
	},

	resizeTimer: null,
	RESIZE_INTERVAL_MILLISECOND: 1000,

	resizeTextareaBasedOnLine: function() {
		var that = STYLEV.RULES;

		if(that.resizeTimer) {
			clearTimeout(that.resizeTimer);
		}

		function resizeTextarea() {
			that.each(that.reasons, function(reason) {
				that.adjustHeightOfTextarea(null, reason);
			});
		}

		if(!that.isShowedAllAtFirst) {
			resizeTextarea();
		} else {
			that.resizeTimer = setTimeout(resizeTextarea, that.RESIZE_INTERVAL_MILLISECOND);
		}
	},

	bindEvents2Textarea: function(textarea) {
		var that = STYLEV.RULES;
		textarea.addEventListener('keyup', that.adjustHeightOfTextarea);
	},

	adjustHeightOfTextarea: function(event, target) {
		var target = target || event.currentTarget || event.target;
		target.style.setProperty('height', 0 + 'px', '');
		target.style.setProperty('height', target.scrollHeight + 'px', '');
	},

	removeLoadingSpinner: function() {
		var loadingSpinner = document.querySelector('#loadingSpinner');
		loadingSpinner && loadingSpinner.parentElement.removeChild(loadingSpinner);
	},

	adjustPosition: function() {
		var that = STYLEV.RULES;
		that.wrapper.style.setProperty('padding-top', that.mainHeader.offsetHeight + 'px', '');
	}

};

STYLEV.RULES.execute();