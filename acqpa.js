$(function(){
	var form = $('.splitForm.registration').splitForm('get');

	if(form) {
		var isReadMode = 'show' == $('.splitForm.registration').data('mode');
		if(isReadMode){
			form.$sections.addClass('complete');
			form.$actions.addClass('hidden');
			form.$el.find('input,textarea,select').each(function(){
				$(this).attr('readonly',true).attr('disabled',true);
			});
		}
		form.$actions.find('.splitForm__action').off('click');
		form.$actions.find('.splitForm__action').on('click',function() {
			// Retrieve the active step
			var activeStep = form.$sections.filter('.active').attr('data-step');

			form.log('action click', this);
			var checkStep = utils.checkForm(form.$sections.filter('.active'),form.renderErrors);

			if($(this).attr('data-dir') != 'prev'){ // action is either next or final
			  if (checkStep.valid === false) {
			    form.$sections.filter('.active').removeClass('complete');
			    form.$wrapper.removeClass('isComplete');
			  } else { 
			    form.$sections.filter('.active').addClass('complete');
			  }
			}

			if($(this).attr('data-dir') != 'final'){ // action is either prev or next
			  acqpa.utils.registration.saveStep(form.$sections.filter('.active'))
			  	.then(r => {
			  		form.switchStep($(this).attr('data-dir'))
			  		.then(r => {
			  			acqpa.utils.registration.saveCurrentStepIndex();
							window.dispatchEvent(new Event('resize'));
			  		});
			  		if('OK' !== r.msg){
			  			notif_fade[r.status](r.msg);
			  		}
			  	})
			  	.catch(err => {
			  		notif_fade.error(err);
			  	});
			}
			else if($(this).attr('data-dir') == 'final' && form.$sections.filter('.active').hasClass('complete')){ // action is final, and form is valid
			  if(checkStep.valid){
			  	acqpa.utils.registration.validateRegistration()
				  	.then(r => {
				  		form.$nav.find('.splitForm__navitem.active').addClass('complete');
				  		form.$wrapper.addClass('isComplete');
				  		var modal = new app.ModalFW({
								name: 'modal--registration--confirm',
								content: r.html,
								width: '1200px',
								onClose: () => {
									modal.destroy();
								},
							});
							modal.open();
				  	})
				  	.catch(err => {
				  		notif_fade.error(err);
				  	});
			  }
			}
	  });

		if (form.enableNav === true) {
			if(isReadMode){
				form.$nav.find('.splitForm__navitem.deactivate').removeClass('deactivate');
			}

      form.$nav.find('.splitForm__navitem').off('click');
      form.$nav.find('.splitForm__navitem').on('click',function(){
        form.log('nav item click', this);
			
				// Retrieve the active step
				var activeStep = form.$sections.filter('.active').attr('data-step');

				if(isReadMode){
					var posNext = form.$nav.find(this).index('.splitForm__navitem:not(.hide)') - form.$nav.find('.active').index('.splitForm__navitem:not(.hide)');
                
					if (posNext < 0) {
	          for (var i = 0; i > posNext; i--) {
						  form.switchStep('prev');
	          }
	        } else {
	          for (var i = 0; i < posNext; i++) {
							form.switchStep('next');
	        	} 
					}

					return;
				}
        
        if (!$(this).hasClass('complete') && !$(this).prev().hasClass('complete'))
          return false;
        
        var posNext = form.$nav.find(this).index('.splitForm__navitem:not(.hide)') - form.$nav.find('.active').index('.splitForm__navitem:not(.hide)');
        
        if (posNext < 0) {
          for (var i = 0; i > posNext; i--) {
           	acqpa.utils.registration.saveStep(form.$sections.filter('.active'))
					  	.then(r => {
					  		form.switchStep('prev')
					  		.then(r => {
					  			acqpa.utils.registration.saveCurrentStepIndex();
					  			window.dispatchEvent(new Event('resize'));
					  		});
					  		notif_fade[r.status](r.msg);
					  	})
					  	.catch(err => {
					  		notif_fade.error(err);
					  	});                    
          }
        } else {
          var checkStep = utils.checkForm(form.$sections.filter('.active'),form.renderErrors);
	        if (checkStep.valid === true) {
	          form.$sections.filter('.active').addClass('complete');
	          for (var i = 0; i < posNext; i++) {
	           	acqpa.utils.registration.saveStep(form.$sections.filter('.active'))
						  	.then(r => {
						  		form.switchStep('next')
						  		.then(r => {
						  			acqpa.utils.registration.saveCurrentStepIndex();
						  			window.dispatchEvent(new Event('resize'));
						  		});
						  		notif_fade[r.status](r.msg);
						  	})
						  	.catch(err => {
						  		notif_fade.error(err);
						  	});        
            }
          } else {
            form.$sections.filter('.active').removeClass('complete');
            form.$wrapper.removeClass('isComplete');
          }
        }
      });
    }
	}

	$('body').on('click','*[data-ajax]',function(e){
		e.preventDefault();
    var blnRequest = true;
    var method = 'POST';
    var url = '';
    var action = '';
    var data = {};
    var button = $(this);

    url = button.attr('href');
    action = button.data('ajax');

    data['action'] = action;
    data['REQUEST_TOKEN'] = rt;
    var strParams = button.data('params');
    if (strParams) {
    	var params = strParams.split(",");
    	for (var i in params) {
    		var param = params[i].split('=');
    		data[param[0]] = param[1];
    	}
    }

    button.closest('.table-list__line').addClass('loading');
    
    if (action.indexOf('delete') != -1) {
      blnRequest = confirm(acqpaLocal.translations.confirm_delete);
    }else if('undefined' !== typeof button.data('confirm')){
      blnRequest = confirm(button.data('confirm'));
    }

    if(blnRequest) {
      acqpa.utils.postData(data, url, method).then(function(r){
        // Display a toastr if there is a status & a msg
        if (r.status && r.msg) {
        	notif_fade[r.status](r.msg);
        }

        // Apply callbacks
				if('success' === r.status && r.callbacks) {
					for(var i in r.callbacks) {
						// i is the function name in utils
						// r.callbacks[i] is an optional array of arguments
						switch(i){
							case 'refreshLine':
								data['action'] = 'refreshLine';
								acqpa.utils.postData(data, url, method).then(function(r){
									// Display a toastr if there is a status & a msg
					        if (r.status && r.msg) 
					        	notif_fade[r.status](r.msg);
					        if (r.html && r.status=='success')
					        	button.closest('.table-list__line').replaceWith(r.html);
              		button.closest('.table-list__line').removeClass('loading');
								});
								break;
							case 'deleteLine':
              	button.closest('.table-list__line').remove();
								break;
							default: 
								acqpa.utils.callbacks[i](r.callbacks[i]);
								break;
						}
					}
				}
				button.closest('.table-list__line').removeClass('loading');
      })
      .catch(function(err){
      	notif_fade['error'](acqpaLocal.translations.technicalError);
				button.closest('.table-list__line').removeClass('loading');
      });
    } else {
      button.closest('.table-list__line').removeClass('loading');
    }
	});


	$('form[data-name="filters"]').each(function(){
		acqpa.utils.assignFiltersEvents($(this));
		// form.find('select').on('change',function(){
		// 	form.submit();
		// });
	});
});
var acqpa = acqpa || {};
acqpa.utils = {};
acqpa.utils.callbacks = {};
acqpa.utils.registration = {};
acqpa.utils.session =  {};
acqpa.utils.attachments = {};
acqpa.utils.intltelinput = {};
acqpa.utils.intltelinput.instances = {};

acqpa.utils.getExamTypeFromCycleAndLevel = function(examCycle, examLevel){
	if(0 === parseInt(examCycle)){
		return "CI"; // initial
	}

	if(-1 !== [1,2].indexOf(parseInt(examLevel))
	&& 0 === parseInt(examCycle) % 9
	){
		return "RC"; // recertification
	}

	return "RE"; // renewal
}

acqpa.utils.setRowLoading = function(element){
	element.closest('.table-list__line').addClass('loading');
}
acqpa.utils.unsetRowLoading = function(element){
	element.closest('.table-list__line').removeClass('loading');
}

acqpa.utils.assignFiltersEvents = function(form){
		form.find('select').on('change',function(){
			form.trigger('submit');
		});
		form.find('input[type="checkbox"]').on('change',function(){
			form.trigger('submit');
		});
		var dateFieldTriggerSubmit = null;
		form.find('input[type="date"]').on('keydown',function(){
			if(null !== dateFieldTriggerSubmit){
				clearTimeout(dateFieldTriggerSubmit);
			}
			dateFieldTriggerSubmit = setTimeout(function(){
				form.trigger('submit');
			}, 2000);
			
		});
		form.find('input[type="date"]').on('change',function(){
			if(null !== dateFieldTriggerSubmit){
				clearTimeout(dateFieldTriggerSubmit);
			}
			dateFieldTriggerSubmit = setTimeout(function(){
				form.trigger('submit');
			}, 2000);
		});
}

/** REGISTRATION **/
// acqpa.utils.registration = {};
acqpa.utils.registration.saveStep = function saveStep(step){
	var form = utils.checkForm(step);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			// reject(acqpaLocal.translations.please_fill_form);
			reject(acqpaLocal.translations.please_fill_form);
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'saveRegistration',
		// 'registration[step]': step.data('step'),
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
    if("tel" === form.inputs[i].type){
      objFields[form.inputs[i].name] = acqpa.utils.intltelinput.getInstance(form.inputs[i]).getNumber();
      console.log('Yepa', form.inputs[i].name, objFields[form.inputs[i].name]);
    }
	}

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
acqpa.utils.registration.saveCurrentStepIndex = function saveCurrentStepIndex(){
	var form = $('.splitForm.registration').splitForm('get');
  var current = form.$sections.toArray().indexOf(form.$sections.filter('.active').get(0));
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'saveRegistration',
		'registration[step]': current,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
acqpa.utils.registration.refreshRegistrationOperators = function refreshRegistrationOperators(){
	$('.operators .table-list__line').remove();

	acqpa.utils.registration.getRegistrationOperators()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.operators .table-list__container').append(r.html);
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.registration.getRegistrationOperators = function getRegistrationOperators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}
acqpa.utils.registration.getOperatorData = function getOperatorData(id){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getOperatorData',
		'id': id,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}

acqpa.utils.registration.refreshRegistrationOperatorValidCertificates = function refreshRegistrationOperatorValidCertificates(operator, level, options, previouslySelectedSession){
	$('.registration_valid_certificates_same_level_options').removeClass('hidden');
	$('.registration_valid_certificates_same_level_options').hide();
	$('.registration_valid_certificates_same_level_options_content').html('');

	// If there is no levels or no options, just hide stuff
	// if (!level || ((1 === level || 2 === level) && !options)) {
	if (!level || (!options || options.length === 0) || !operator) {
		return;
	}
	acqpa.utils.registration.getRegistrationOperatorValidCertificatesByLevelAndOptions(operator, level, options)
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}

			if (null !== r.html && r.html.length > 0) {
				$('.registration_valid_certificates_same_level_options').show();
				$('.registration_valid_certificates_same_level_options_content').html(r.html);
			}
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}

acqpa.utils.registration.getRegistrationOperatorValidCertificatesByLevelAndOptions = function getRegistrationOperatorValidCertificatesByLevelAndOptions(operator, level, options){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getValidCertificatesByOperatorAndLevelAndOptions',
		'operator': operator,
		'level': level,
		'options': options,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}


acqpa.utils.registration.refreshRegistrationOperatorExamSessionByLevelAndOptionsAndCycle = function refreshRegistrationOperatorExamSessionByLevelAndOptionsAndCycle(level, options, cycle, previouslySelectedSession){
	$('select.registration_session option').remove();
	$('select.registration_session').parent().hide();
	$('.registration_session_no_sessions').hide();
	$('#sessionDates').hide();
	$('.registration_present_at_no_dates').hide();

	// If there is no levels or no options, just hide stuff
	// if (!level || ((1 === level || 2 === level) && !options)) {
	if (!level || (!options || options.length === 0)) {
		return;
	}

	acqpa.utils.registration.getRegistrationOperatorExamSessionByLevelAndOptionsAndCycle(level, options, cycle, previouslySelectedSession)
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}

			if (null === r.html) {
				$('.registration_session_no_sessions').show();
				$('select.registration_session').trigger('change');
			} else {
				$('select.registration_session').parent().show();
				$('select.registration_session').append(r.html);
				$('#sessionDates').show();
				$('select.registration_session').trigger('change');
			}
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}

acqpa.utils.registration.getRegistrationOperatorExamSessionByLevelAndOptionsAndCycle = function getRegistrationOperatorExamSessionByLevelAndOptionsAndCycle(level, options, cycle, previouslySelectedSession){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getExamSessionByLevelAndOptions',
		'level': level,
		'options': options,
		'cycle': cycle,
		'previouslySelectedSession': previouslySelectedSession,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
///////////
acqpa.utils.registration.refreshRegistrationOperatorSessionDates = function refreshRegistrationOperatorSessionDates(registrationId, session, previouslySelectedDate){
	$('.registration_present_at input').remove();
	$('.registration_present_at label').remove();
	$('.registration_present_at').parent().hide();
	$('.registration_present_at_no_dates').hide();

	// If there is no session, just hide stuff
	if (!session) {
		return;
	}

	acqpa.utils.registration.getRegistrationOperatorExamSessionDatesById(registrationId, session, previouslySelectedDate)
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}

			if (null === r.html) {
				$('.registration_present_at_no_dates').show();
			} else {
				$('.registration_present_at').parent().show();
				$('.registration_present_at').append(r.html);
				window.dispatchEvent(new Event('resize'));
			}
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}

acqpa.utils.registration.getRegistrationOperatorExamSessionDatesById = function getRegistrationOperatorExamSessionDatesById(registrationId, session, previouslySelectedDate){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getExamSessionDatesById',
		'registrationId': registrationId,
		'session': session,
		'previouslySelectedDate': previouslySelectedDate,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
///////////

acqpa.utils.registration.refreshRegistrationOperatorCertificatesSubform = function refreshRegistrationOperatorCertificatesSubform(operatorId, registrationOperatorId){
	$('#registration__form__subform-certificate_renewal_source').html('');
	$('.registration_certificate_renewal_source_no_certificates.no-item__container').hide();

	return new Promise(function (resolve, reject) {
		acqpa.utils.registration.getRegistrationOperatorCertificatesSubform(operatorId, registrationOperatorId)
		.then(r => {
			if("error" == r.status) {
				notif_fade.error(r.msg);
			} else {
				if(r.msg){
					notif_fade.success(r.msg);
				}

				if (null === r.html) {
					$('.registration_certificate_renewal_source_no_certificates.no-item__container').show();
					reject(r.msg);
				} else {
					$('#registration__form__subform-certificate_renewal_source').append(r.html);
					window.dispatchEvent(new Event('resize'));
					resolve(r);
				}
			}
		})
	  .catch(err => {
			$('.registration_certificate_renewal_source_no_certificates.no-item__container').show();
	    notif_fade.error(err);
      reject(err);
	  });
	});
}

acqpa.utils.registration.getRegistrationOperatorCertificatesSubform = function getRegistrationOperatorCertificatesSubform(operatorId, registrationOperatorId){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getRegistrationOperatorEditCertificatesSubForm',
		'operator': operatorId,
		'id': registrationOperatorId,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
///

acqpa.utils.registration.refreshRegistrationOperatorCertificatesAdditionnalSubform = function refreshRegistrationOperatorCertificatesAdditionnalSubform(operatorId, registrationOperatorId,certificateSourceId){
	$('#registration__form__subform-certificate_renewal_additionnal').html('');
	$('.registration_operator_edit_subform_certificate_renewal_additionnal.no-item__container').hide();

	return new Promise(function (resolve, reject) {
		acqpa.utils.registration.getRegistrationOperatorCertificatesAdditionnalSubform(operatorId, registrationOperatorId,certificateSourceId)
		.then(r => {
			if("error" == r.status) {
				notif_fade.error(r.msg);
			} else {
				if(r.msg){
					notif_fade.success(r.msg);
				}

				if (null === r.html) {
					$('.registration_operator_edit_subform_certificate_renewal_additionnal.no-item__container').show();
					reject(r.msg);
				} else {
					$('#registration__form__subform-certificate_renewal_additionnal').append(r.html);
					window.dispatchEvent(new Event('resize'));
					resolve(r);
				}
			}
		})
	  .catch(err => {
			$('.registration_operator_edit_subform_certificate_renewal_additionnal.no-item__container').show();
	    notif_fade.error(err);
      reject(err);
	  });
	});
}

acqpa.utils.registration.getRegistrationOperatorCertificatesAdditionnalSubform = function getRegistrationOperatorCertificatesAdditionnalSubform(operatorId, registrationOperatorId,certificateSourceId){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getRegistrationOperatorEditCertificatesAdditionnalSubForm',
		'operator': operatorId,
		'id': registrationOperatorId,
		'certificateSourceId': certificateSourceId,
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
///
acqpa.utils.registration.refreshRegistrationOperatorSubform = function refreshRegistrationOperatorSubform(examType, examCycle, examLevel, operatorId, registrationOperatorId, certificateSourceId, certificatesAdditionnalIds){
	$('#registration__form__subform').html('');
	$('.registration__form__subform.no-item__container').hide();

	return new Promise(function (resolve, reject) {
		acqpa.utils.registration.getRegistrationOperatorSubform(examType, examCycle, examLevel, operatorId, registrationOperatorId, certificateSourceId, certificatesAdditionnalIds)
		.then(r => {
			if("error" == r.status) {
				notif_fade.error(r.msg);
			} else {
				if(r.msg){
					notif_fade.success(r.msg);
				}

				if (null === r.html) {
					$('.registration__form__subform.no-item__container').show();
					reject(r.msg);
				} else {
					$('#registration__form__subform').append(r.html);
					window.dispatchEvent(new Event('resize'));
					resolve(r);
				}
			}
		})
	  .catch(err => {
			$('.registration__form__subform.no-item__container').show();
	    notif_fade.error(err);
      reject(err);
	  });
	});
}

acqpa.utils.registration.getRegistrationOperatorSubform = function getRegistrationOperatorSubform(examType, examCycle, examLevel, operatorId, registrationOperatorId, certificateSourceId, certificatesAdditionnalIds){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'getRegistrationOperatorEditSubForm',
		'exam_type': examType,
		'exam_cycle': examCycle,
		'exam_level': examLevel,
		'operator': operatorId,
		'id': registrationOperatorId,
		'certificateSourceId': certificateSourceId,
		'certificatesAdditionnalIds[]': certificatesAdditionnalIds,
	};
	// console.log(objFields);

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
///////////
acqpa.utils.registration.checkRegistrationOperatorForm = function checkRegistrationOperatorForm(modal){
	var result = utils.checkForm(modal,false);

	var expKeys = [];
	const expKeysRegExp = /registration\[professional_experiences\]\[(.*)\]\[(.*)\]/;
	var objFields = {};
	for (var i in result.inputs) {
		objFields[result.inputs[i].name] = result.inputs[i].value;
		if(result.inputs[i].name.indexOf('registration[professional_experiences]') > -1){
			var found = result.inputs[i].name.match(expKeysRegExp);
			if(found && "x_x_x" != found[1] && -1 == expKeys.indexOf(found[1])){
				expKeys.push(found[1]);
			}
		}else if("tel" === result.inputs[i].type){
      objFields[result.inputs[i].name] = acqpa.utils.intltelinput.getInstance(result.inputs[i]).getNumber();
    }
	}

	var incomplete = {};
	var missing = {};
	for (var i in result.inputs) {
		var input = result.inputs[i];
		if(!input.valid){
			switch(input.name){
				case 'registration[present_at]':
					var label = modal.find('#registration__present_at').html().replace(':','').trim();
				break;
				case 'registration[exam_options]':
					var label = modal.find('label[for="registration__exam_options"]').html().replace(':','').trim();
				break;
				case 'registration[exam_options_set]':
					var label = modal.find('#registration__exam_options_set').html().replace(':','').trim();
				break;
				case 'registration[professional_experiences_options]':
					var label = modal.find('.registration_professional_experience th[data-name="options"]').html().replace(':','').trim();
				break;
				default:
					var arrMatches = input.name.match(expKeysRegExp);
					if(null !== arrMatches){
						var field = arrMatches[2];
						var label = modal.find('.registration_professional_experience th[data-name="'+field+'"]').html().replace(':','').trim();
					}else{
						// var label = modal.find('label[for="'+modal.find('[name="'+input.name+'"]').attr('id')+'"]');
						var label = utils.getInputLabel(input.id,input.name.replace('[]', ''));
					}
			}
			missing[input.name] = "undefined" !== typeof label && input.id !== label ? label : input.name;
		}
	}

	// retrieve uploaded files if any
	// and add them to objFields
	// additionnal AJAX options to provide :  {contentType: false,processData: false}
	var arrAttachmentsFields = ["operator[identity_picture]","operator[identity_piece]","operator[cv]","registration[employer_certificate]"];
	for(var i in arrAttachmentsFields){
		var input = modal.find('[name="'+arrAttachmentsFields[i]+'"]');
		// var input = result.inputs[i];
		// var inputName=arrAttachmentsFields[i];
		var inputName=input.name;
		if("undefined" != typeof modal.find('input[data-name="'+inputName+'"]').attr('required')
		&& 0 === modal.find('input[name="'+inputName+'"]').length
		){
			// var label = modal.find('label[for="'+modal.find('[name="'+inputName+'"]').attr('id')+'"]');
			var label = utils.getInputLabel(input.id,input.name.replace('[]', ''));
			missing[inputName] = "undefined" !== typeof label && input.id !== label ? label : inputName;
		}

		if(0 !== modal.find('input[name="'+inputName+'"]').length){
			objFields[inputName] = modal.find('input[name="'+inputName+'"]')[0].value;
		}
	}

	if((1 == objFields['registration[exam_level]'] || 2 == objFields['registration[exam_level]'])
		&& 0 == objFields['registration[exam_options]'].length
	){
			var input = result.inputs["registration[exam_options]"];
			var inputName=input.name;
			// var inputName="registration[exam_options]";
			// var label = modal.find('label[for="'+modal.find('[name="'+inputName+'"]').attr('id')+'"]');
			var label = utils.getInputLabel("registration__exam_options",input.name.replace('[]', ''));
			// var label = modal.find('label[for="registration__exam_options"]');
			missing[inputName] = "undefined" !== typeof label ? label : inputName;
	}

	if('renewal' === objFields['registration[exam_type_custom]']){
		if(0 === objFields['registration[certificate_renewal_source]'].length){
			var input = result.inputs["registration[certificate_renewal_source]"];
			var inputName=input.name;
			// var inputName="registration[certificate_renewal_source]";
			// var label = modal.find('label[for="'+modal.find('[name="'+inputName+'"]').attr('id')+'"]');
			var label = utils.getInputLabel(input.id,input.name.replace('[]', ''));
			missing[inputName] = "undefined" !== typeof label && input.id !== label ? label : inputName;
		}
	}

	// if professional exp are present, check options
	var needExp = 0 != objFields['registration[exam_cycle]'];
	var nbExp = 0;
	if(modal.find('.registration_professional_experience')){
		var expOptions = [];
		for(var i = 0; i < expKeys.length; i++){
			var key = expKeys[i];
			if(objFields['registration[professional_experiences]['+key+'][reference]']){
				expOptions = expOptions.concat(objFields['registration[professional_experiences]['+key+'][options]']);
				nbExp++;
			}else{
				break;
			}
		}
	}

	if(needExp && 0 == nbExp){
		// return new Promise(function (resolve, reject) {
		// 	reject('Veuillez renseigner au moins une expérience professionnelle');
		// });
		missing['registration[professional_experiences]'] = modal.find('table.registration_professional_experience tbody tr:nth-of-type(1) th').html();
	}

	if(nbExp > 0){
		//now we have exam_options ids to put against ... expOptions letters ...
		var optionsMissing = [];
		for(var i in objFields['registration[exam_options]']){
			var $input = modal.find('[name="registration[exam_options]"][value="'+objFields['registration[exam_options]'][i]+'"]');
			if(!$input){
				continue;
			}
			var letter = $input.data('letter');
			if(-1 == expOptions.indexOf(letter)){
				optionsMissing.push(letter);
			}
		}

		if(optionsMissing.length > 0){
			// if(!confirm('Les options "'+optionsMissing.join()+'" ne sont pas couvertes par vos expériences professionnelles. Voulez-vous continuer ?')){
			if(!confirm(acqpaLocal.translations.missingOptionsConfirm(optionsMissing.join()))){
			// 	return new Promise(function (resolve, reject) {
			// 		reject('Enregistrement annulé par l\'utilisateur');
			// 	});
			}
			incomplete['registration[professional_experiences_options]'] = modal.find('table.registration_professional_experience tbody tr:nth-of-type(2) th[data-name="options"]').html();
		}
	}

	// operator must be 18+
	var isAdult = true;
	var birthDate = new Date(objFields['operator[date_of_birth]']).getTime(); // Y-m-d format to timestamp
	var currentDate = new Date();
	var eighteenYearsFromNowDate = new Date(
		(currentDate.getFullYear()-18)
		+'-'
		+(currentDate.getMonth() < 10 ? '0'+currentDate.getMonth() : currentDate.getMonth())
		+'-'
		+(currentDate.getDate() < 10 ? '0'+currentDate.getDate() : currentDate.getDate())
	).getTime();
	if(birthDate > eighteenYearsFromNowDate){
		// return new Promise(function (resolve, reject) {
		// 	reject('L \'opérateur doit être majeur pour être inscrit.');
		// });
		isAdult = false;
	}
	var input = result.inputs["operator[date_of_birth]"];
	var inputName=input.name;
	// var inputName="operator[date_of_birth]";
	// var label = modal.find('label[for="'+modal.find('[name="'+inputName+'"]').attr('id')+'"]');
	var label = utils.getInputLabel(input.id,input.name.replace('[]', ''));
	var isAdultField = "undefined" !== typeof label && input.id !== label ? label : inputName;

	result['values'] = objFields;
	result['missing'] = missing;
	result['incomplete'] = incomplete;
	result['isAdult'] = isAdult;
	result['isAdultField'] = isAdultField;

	return result;
}

acqpa.utils.registration.showRegistrationOperatorMissingInfos = function showRegistrationOperatorMissingInfos(modal, result){
	var divMissing = modal.find('.registration_draft_informations__missing');
	var divComplete = modal.find('.registration_draft_informations__complete');

	divMissing.addClass('hidden').html('');
	divComplete.addClass('hidden');

	if(result.valid
	&& 0 === result['missing'].length
	&& 0 === result['incomplete'].length
	&& result['isAdult']
	){
		divComplete.removeClass('hidden');
		return;
	}
	divMissing.removeClass('hidden');

	var table = document.createElement('table');
	table.setAttribute('class','table-list__container');

	for(var i in result['missing']){
		var tdLabel = document.createElement('td');
		tdLabel.innerHTML = result['missing'][i];// + '<br />' + i;
		console.log(result['missing'][i]);
		var tdText = document.createElement('td');
		tdText.innerHTML = acqpaLocal.translations.field_mandatory;

		var tr = document.createElement('tr');
		tr.appendChild(tdLabel);
		tr.appendChild(tdText);
		table.appendChild(tr);
	}

	for(var i in result['incomplete']){
		var tdLabel = document.createElement('td');
		tdLabel.innerHTML = result['incomplete'][i];// + '<br />' + i;
		var tdText = document.createElement('td');
		tdText.innerHTML = acqpaLocal.translations.field_incomplete;

		var tr = document.createElement('tr');
		tr.appendChild(tdLabel);
		tr.appendChild(tdText);
		table.appendChild(tr);
	}

	if(!result['isAdult']){
		var tdLabel = document.createElement('td');
		tdLabel.innerHTML = result['isAdultField'][i];
		var tdText = document.createElement('td');
		tdText.innerHTML = acqpaLocal.translations.field_incomplete;

		var tr = document.createElement('tr');
		tr.appendChild(tdLabel);
		tr.appendChild(tdText);
		table.appendChild(tr);
	}

	var fakeDiv = document.createElement('div');
	fakeDiv.appendChild(table);
	divMissing.append(fakeDiv.innerHTML);

	$('.registration_modal.accordionFW').accordionFW('get').deployItem($('#registration_draft_informations'));
}

acqpa.utils.registration.saveRegistrationOperator = function saveRegistrationOperator(modal){
	var result = acqpa.utils.registration.checkRegistrationOperatorForm(modal);
	var blnIsValid = result.valid;
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'saveRegistrationOperator',
	};

	acqpa.utils.registration.showRegistrationOperatorMissingInfos(modal, result);


	for(var i in result['values']){
		objFields[i] = result['values'][i];
	}

	// manually check operator data
	if(0 === objFields['operator[firstname]'].length){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_operator_firstname);
		});
	}
	if(0 === objFields['operator[lastname]'].length){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_operator_lastname);
		});
	}
	if(0 === objFields['operator[email]'].length){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_operator_email);
		});
	}
	if(0 === objFields['registration[exam_type]'].length){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_exam_type);
		});
	}
	if(0 === objFields['registration[exam_level]'].length){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_exam_level);
		});
	}
	if(0 !== $('input[name="operator[identity_picture]"]').length){
		objFields['operator[identity_picture]'] = $('input[name="operator[identity_picture]"]')[0].value;
	}

	if(0 !== $('input[name="operator[identity_piece]"]').length){
		objFields['operator[identity_piece]'] = $('input[name="operator[identity_piece]"]')[0].value;
	}

	if(0 !== $('input[name="operator[cv]"]').length){
		objFields['operator[cv]'] = $('input[name="operator[cv]"]')[0].value;
	}

	if(0 !== $('input[name="registration[employer_certificate]"]').length){
		objFields['registration[employer_certificate]'] = $('input[name="registration[employer_certificate]"]')[0].value;
	}

	// better check
	if(!blnIsValid){
		if('draft' === $('input[name="registration[start_status]"]').val() || '' === $('input[name="registration[start_status]"]').val()){
			if(!window.confirm(acqpaLocal.translations.registration_draft_confirm)){
				return new Promise(function (resolve, reject) {
					reject(acqpaLocal.translations.registration_save_canceled_user);
				});
			}
		}else{
				return new Promise(function (resolve, reject) {
					reject(acqpaLocal.translations.registration_save_data_missing_can_t_be_draft_again);
				});
		}

		objFields['registration[isDraft]'] = true;
	}

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}

acqpa.utils.registration.saveRegistrationOperator_old = function saveRegistrationOperator_old(modal){
	var form = utils.checkForm(modal);
	console.log(acqpa.utils.registration.checkRegistrationOperatorForm(modal));
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_form);
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'saveRegistrationOperator',
	};

	var expKeys = [];
	const expKeysRegExp = /registration\[professional_experiences\]\[(.*)\]\[(.*)\]/;

	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
		if(form.inputs[i].name.indexOf('registration[professional_experiences]') > -1){
			var found = form.inputs[i].name.match(expKeysRegExp);
			if(found && "x_x_x" != found[1] && -1 == expKeys.indexOf(found[1])){
				expKeys.push(found[1]);
			}
		}else if("tel" === form.inputs[i].type){
      objFields[form.inputs[i].name] = acqpa.utils.intltelinput.getInstance(form.inputs[i]).getNumber();
    }
	}
	
	// retrieve uploaded files if any 
	// and add them to objFields 
	// additionnal AJAX options to provide :  {contentType: false,processData: false}
	if("undefined" != typeof $('input[data-name="operator[identity_picture]"]').attr('required')
	&& 0 === $('input[name="operator[identity_picture]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_operator_identity_picture);
		});
	}
	if(0 !== $('input[name="operator[identity_picture]"]').length){
		objFields['operator[identity_picture]'] = $('input[name="operator[identity_picture]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="operator[identity_piece]"]').attr('required')
	&& 0 === $('input[name="operator[identity_piece]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_operator_identity_piece);
		});
	}
	if(0 !== $('input[name="operator[identity_piece]"]').length){
		objFields['operator[identity_piece]'] = $('input[name="operator[identity_piece]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="operator[cv]"]').attr('required')
	&& 0 === $('input[name="operator[cv]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_operator_cv);
		});
	}
	if(0 !== $('input[name="operator[cv]"]').length){
		objFields['operator[cv]'] = $('input[name="operator[cv]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="registration[employer_certificate]"]').attr('required')
	&& 0 === $('input[name="registration[employer_certificate]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_registration_employer_certificate);
		});
	}
	if(0 !== $('input[name="registration[employer_certificate]"]').length){
		objFields['registration[employer_certificate]'] = $('input[name="registration[employer_certificate]"]')[0].value;
	}

	if((1 == objFields['registration[exam_level]'] || 2 == objFields['registration[exam_level]'])
		&& 0 == objFields['registration[exam_options]'].length
	){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_registration_exam_option);
		});
	}

	if('renewal' === objFields['registration[exam_type_custom]']){
		if(0 === objFields['registration[certificate_renewal_source]'].length){
			return new Promise(function (resolve, reject) {
				reject(acqpaLocal.translations.please_fill_registration_certificate_to_renew);
			});
		}
	}

	// if professional exp are present, check options
	var needExp = 0 != objFields['registration[exam_cycle]'];
	var nbExp = 0;
	if($('.registration_professional_experience')){
		var expOptions = [];
		for(var i = 0; i < expKeys.length; i++){
			var key = expKeys[i];
			if(objFields['registration[professional_experiences]['+key+'][reference]']){
				expOptions = expOptions.concat(objFields['registration[professional_experiences]['+key+'][options]']);
				nbExp++;
			}else{
				break;
			}
		}
	}

	if(needExp && 0 == nbExp){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_registration_prof_xp);
		});
	}

	if(nbExp > 0){
		//now we have exam_options ids to put against ... expOptions letters ...
		var optionsMissing = [];
		for(var i in objFields['registration[exam_options]']){
			var $input = $('[name="registration[exam_options]"][value="'+objFields['registration[exam_options]'][i]+'"]');
			if(!$input){
				continue;
			}
			var letter = $input.data('letter');
			if(-1 == expOptions.indexOf(letter)){
				optionsMissing.push(letter);
			}
		}

		if(optionsMissing.length > 0){
			// if(!confirm('Les options "'+optionsMissing.join()+'" ne sont pas couvertes par vos expériences professionnelles. Voulez-vous continuer ?')){
			if(!confirm(acqpaLocal.translations.missingOptionsConfirm(optionsMissing.join()))){
				return new Promise(function (resolve, reject) {
					reject(acqpaLocal.translations.registration_save_canceled_user);
				});
			}
		}
	}

	// operator must be 18+
	var birthDate = new Date(objFields['operator[date_of_birth]']).getTime(); // Y-m-d format to timestamp
	var currentDate = new Date();
	var eighteenYearsFromNowDate = new Date(
		(currentDate.getFullYear()-18)
		+'-'
		+(currentDate.getMonth() < 10 ? '0'+currentDate.getMonth() : currentDate.getMonth())
		+'-'
		+(currentDate.getDate() < 10 ? '0'+currentDate.getDate() : currentDate.getDate())
	).getTime();
	if(birthDate > eighteenYearsFromNowDate){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.registration_operator_must_be_18);
		});
	}

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}

// acqpa.utils.registration.saveRegistrationOperatorAsDraft = function saveRegistrationOperatorAsDraft(modal){
// 	var form = utils.checkForm(modal,false);

// 	var objFields = {
// 		'REQUEST_TOKEN': rt,
// 		'module_type': 'acqpa_registration_edit',
// 		'action': 'saveRegistrationOperator',
// 	};
// 	objFields['registration[isDraft]'] = true;

// 	var data = {};
// 	var expKeys = [];
// 	const expKeysRegExp = /registration\[professional_experiences\]\[(.*)\]\[(.*)\]/;

// 	for (var i in form.inputs) {
// 		objFields[form.inputs[i].name] = form.inputs[i].value;
// 		if(form.inputs[i].name.indexOf('registration[professional_experiences]') > -1){
// 			var found = form.inputs[i].name.match(expKeysRegExp);
// 			if(found && "x_x_x" != found[1] && -1 == expKeys.indexOf(found[1])){
// 				expKeys.push(found[1]);
// 			}
// 		}else if("tel" === form.inputs[i].type){
//       objFields[form.inputs[i].name] = acqpa.utils.intltelinput.getInstance(form.inputs[i]).getNumber();
//     }
// 	}

// 	if(0 !== $('input[name="operator[identity_picture]"]').length){
// 		objFields['operator[identity_picture]'] = $('input[name="operator[identity_picture]"]')[0].value;
// 	}

// 	if(0 !== $('input[name="operator[identity_piece]"]').length){
// 		objFields['operator[identity_piece]'] = $('input[name="operator[identity_piece]"]')[0].value;
// 	}

// 	if(0 !== $('input[name="operator[cv]"]').length){
// 		objFields['operator[cv]'] = $('input[name="operator[cv]"]')[0].value;
// 	}

// 	if(0 !== $('input[name="registration[employer_certificate]"]').length){
// 		objFields['registration[employer_certificate]'] = $('input[name="registration[employer_certificate]"]')[0].value;
// 	}

// 	// manually check operator data
// 	if(0 === objFields['operator[firstname]'].length){
// 		return new Promise(function (resolve, reject) {
// 			reject('Veuillez renseigner le prénom de l\'opérateur');
// 		});
// 	}
// 	if(0 === objFields['operator[lastname]'].length){
// 		return new Promise(function (resolve, reject) {
// 			reject('Veuillez renseigner le nom de l\'opérateur');
// 		});
// 	}
// 	if(0 === objFields['operator[email]'].length){
// 		return new Promise(function (resolve, reject) {
// 			reject('Veuillez renseigner l\'adresse email de l\'opérateur');
// 		});
// 	}
// 	if(0 === objFields['registration[exam_type]'].length){
// 		return new Promise(function (resolve, reject) {
// 			reject('Veuillez renseigner le type de certification demandée');
// 		});
// 	}
// 	if(0 === objFields['registration[exam_level]'].length){
// 		return new Promise(function (resolve, reject) {
// 			reject('Veuillez renseigner le niveau de certification demandée');
// 		});
// 	}

// 	// operator must be 18+
// 	var birthDate = new Date(objFields['operator[date_of_birth]']).getTime(); // Y-m-d format to timestamp
// 	var currentDate = new Date();
// 	var eighteenYearsFromNowDate = new Date(
// 		(currentDate.getFullYear()-18)
// 		+'-'
// 		+(currentDate.getMonth() < 10 ? '0'+currentDate.getMonth() : currentDate.getMonth())
// 		+'-'
// 		+(currentDate.getDate() < 10 ? '0'+currentDate.getDate() : currentDate.getDate())
// 	).getTime();
// 	if(birthDate > eighteenYearsFromNowDate){
// 		return new Promise(function (resolve, reject) {
// 			reject('L \'opérateur doit être majeur pour être inscrit.');
// 		});
// 	}

// 	return new Promise(function (resolve, reject) {
// 		acqpa.utils.postData(objFields)
// 		.then(r => {
// 			if("error" == r.status) {
// 				reject(r);
// 			} else {
// 				resolve(r);
// 			}
// 		})
// 	  .catch(err => {
// 	    reject(err);
// 	  });
// 	});
// }

acqpa.utils.registration.validateRegistration = function validateRegistration(modal){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'validateRegistration',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
acqpa.utils.registration.confirmRegistration = function confirmRegistration(modal){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_registration_edit',
		'action': 'confirmRegistration',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}

/** SESSION **/
// acqpa.utils.session = {};
acqpa.utils.session.refreshSessionTranslators = function refreshSessionTranslators(){
	$('.translators .table-list__line').remove();

	acqpa.utils.session.getSessionTranslators()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.translators .table-list__container').append(r.html);
			if(0 == r.html.length){
				$('.translators .no-item__container').removeClass('hidden');
				$('.translators .table-list__headline').addClass('hidden');
			}else{
				$('.translators .no-item__container').addClass('hidden');
				$('.translators .table-list__headline').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionTranslators = function getSessionTranslators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getTranslators',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
acqpa.utils.session.saveExamSessionTranslator = function saveExamSessionTranslator(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_form);
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'saveExamSessionTranslator',
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}
acqpa.utils.session.refreshSessionExaminers = function refreshSessionExaminers(){
	$('.examiners .table-list__line').remove();

	acqpa.utils.session.getSessionExaminers()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.examiners .table-list__container').append(r.html);
			if(0 == r.html.length){
				$('.examiners .no-item__container').removeClass('hidden');
				$('.examiners .table-list__headline').addClass('hidden');
			}else{
				$('.examiners .no-item__container').addClass('hidden');
				$('.examiners .table-list__headline').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionExaminers = function getSessionExaminers(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getExaminers',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
acqpa.utils.session.saveExamSessionExaminer = function saveExamSessionExaminer(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject(acqpaLocal.translations.please_fill_form);
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'saveExamSessionExaminer',
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	  .catch(err => {
	    reject(err);
	  });
	});
}

acqpa.utils.session.refreshSessionDocuments = function refreshSessionDocuments(){
	$('.documents .table-list__line').remove();

	acqpa.utils.session.getSessionDocuments()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.documents .table-list__container').append(r.html);
			if(0 == r.html.length){
				$('.documents .no-item__container').removeClass('hidden');
				$('.documents .table-list__headline').addClass('hidden');
			}else{
				$('.documents .no-item__container').addClass('hidden');
				$('.documents .table-list__headline').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionDocuments = function getSessionDocuments(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getDocuments',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
acqpa.utils.session.refreshSessionOperators = function refreshSessionOperators(){
	$('.operators .table-list__line').remove();

	acqpa.utils.session.getRegistrationOperators()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.operators .table-list__container').append(r.html);
			if(0 == r.html.length){
				$('.operators .no-item__container').removeClass('hidden');
				$('.operators .table-list__headline').addClass('hidden');
			}else{
				$('.operators .no-item__container').addClass('hidden');
				$('.operators .table-list__headline').removeClass('hidden');
			}
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getRegistrationOperators = function getRegistrationOperators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}

acqpa.utils.session.refreshSessionExaminersMissingOptionsAndLevels = function refreshSessionExaminersMissingOptionsAndLevels(){
	$('#exam-session-examiners-missing').html('');

	acqpa.utils.session.getSessionExaminersMissingOptionsAndLevels()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('#exam-session-examiners-missing').append(r.html);
			if(0 == r.html.length){
				$('#exam-session-examiners-missing').addClass('hidden');
			}else{
				$('#exam-session-examiners-missing').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionExaminersMissingOptionsAndLevels = function getSessionExaminersMissingOptionsAndLevels(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionExaminersMissingOptionsAndLevels',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}

acqpa.utils.session.refreshSessionExaminersSpareOptionsAndLevels = function refreshSessionExaminersSpareOptionsAndLevels(){
	$('#exam-session-examiners-spare').html('');

	acqpa.utils.session.getSessionExaminersSpareOptionsAndLevels()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('#exam-session-examiners-spare').append(r.html);
			if(0 == r.html.length){
				$('#exam-session-examiners-spare').addClass('hidden');
			}else{
				$('#exam-session-examiners-spare').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionExaminersSpareOptionsAndLevels = function getSessionExaminersSpareOptionsAndLevels(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionExaminersSpareOptionsAndLevels',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}


acqpa.utils.session.refreshSessionTranslatorsMissingLanguages = function refreshSessionTranslatorsMissingLanguages(){
	$('#exam-session-translators-missing').html('');

	acqpa.utils.session.getSessionTranslatorsMissingLanguages()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('#exam-session-translators-missing').append(r.html);
			if(0 == r.html.length){
				$('#exam-session-translators-missing').addClass('hidden');
			}else{
				$('#exam-session-translators-missing').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionTranslatorsMissingLanguages = function getSessionTranslatorsMissingLanguages(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionTranslatorsMissingLanguages',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}
acqpa.utils.session.refreshSessionTranslatorsSpareLanguages = function refreshSessionTranslatorsSpareLanguages(){
	$('#exam-session-translators-spare').html('');

	acqpa.utils.session.getSessionTranslatorsSpareLanguages()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('#exam-session-translators-spare').append(r.html);
			if(0 == r.html.length){
				$('#exam-session-translators-spare').addClass('hidden');
			}else{
				$('#exam-session-translators-spare').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionTranslatorsSpareLanguages = function getSessionTranslatorsSpareLanguages(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionTranslatorsSpareLanguages',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}

acqpa.utils.session.refreshSessionOperatorsMissingConfigurations = function refreshSessionOperatorsMissingConfigurations(){
	$('#exam-session-operator-configuration-missing').html('');

	acqpa.utils.session.getSessionOperatorsMissingConfigurations()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('#exam-session-operator-configuration-missing').append(r.html);
			if(0 == r.html.length){
				$('#exam-session-operator-configuration-missing').addClass('hidden');
			}else{
				$('#exam-session-operator-configuration-missing').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionOperatorsMissingConfigurations = function getSessionOperatorsMissingConfigurations(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionOperatorsMissingConfigurations',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}

acqpa.utils.session.refreshSessionOperatorsForManage = function refreshSessionOperatorsForManage(){
	acqpa.utils.session.getRegistrationOperatorsForManage()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.operators .table-list__line').remove();
			$('.operators .table-list__container').append(r.html);
			if(0 == r.html.length){
				$('.operators .no-item__container').removeClass('hidden');
				$('.operators .table-list__headline').addClass('hidden');
			}else{
				$('.operators .no-item__container').addClass('hidden');
				$('.operators .table-list__headline').removeClass('hidden');
			}
			if ($('.operators')['table-list']('get')  !== undefined)
				$('.operators')['table-list']('get').convertTooltips();
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getRegistrationOperatorsForManage = function getRegistrationOperatorsForManage(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_manage',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}



acqpa.utils.session.refreshSessionOperatorsMissingConfigurationsForManage = function refreshSessionOperatorsMissingConfigurationsForManage(){
	$('#exam-session-operator-configuration-missing').html('');

	acqpa.utils.session.getSessionOperatorsMissingConfigurationsForManage()
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('#exam-session-operator-configuration-missing').append(r.html);
			if(0 == r.html.length){
				$('#exam-session-operator-configuration-missing').addClass('hidden');
			}else{
				$('#exam-session-operator-configuration-missing').removeClass('hidden');
			}
			window.dispatchEvent(new Event('resize'));
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.session.getSessionOperatorsMissingConfigurationsForManage = function getSessionOperatorsMissingConfigurationsForManage(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_manage',
		'action': 'getSessionOperatorsMissingConfigurations',
	};

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
    .catch(err => {
        reject(err);
    });
	});
}

/** attachments */
acqpa.utils.attachments.refreshAttachmentLines = function refreshAttachmentLines(module,ptable, entity, filters){
	acqpa.utils.attachments.getAttachmentLines(module,ptable,entity, filters)
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}
			$('.attachments[data-entity="'+entity+'"][data-ptable="'+ptable+'"] .table-list__line').remove();
			$('.attachments[data-entity="'+entity+'"][data-ptable="'+ptable+'"] .table-list__container').append(r.html);
			if(0 == r.html.length){
				$('.attachments[data-entity="'+entity+'"][data-ptable="'+ptable+'"] .no-item__container').removeClass('hidden');
				$('.attachments[data-entity="'+entity+'"][data-ptable="'+ptable+'"] .table-list__headline').addClass('hidden');
			}else{
				$('.attachments[data-entity="'+entity+'"][data-ptable="'+ptable+'"] .no-item__container').addClass('hidden');
				$('.attachments[data-entity="'+entity+'"][data-ptable="'+ptable+'"] .table-list__headline').removeClass('hidden');
			}
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}
acqpa.utils.attachments.getAttachmentLines = function getAttachmentLines(module,ptable, entity, filters){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module-type': 'attachments-service',
		'ptable': ptable,
		'entity': entity,
		// 'filters': filters,
		'module': module,
		'action': 'getAttachmentLines',
	};

  for (var i in filters) {
  	objFields['filters['+i+']'] = filters[i];
  }

	return new Promise(function (resolve, reject) {
		acqpa.utils.postData(objFields)
		.then(r => {
			if("error" == r.status) {
				reject(r.msg);
			} else {
				resolve(r);
			}
		})
	    .catch(err => {
	        reject(err);
	    });
	});
}

/** UTILITIES **/
acqpa.utils.postData = async function postData(data, url = "", method = "POST") {
	var request = new FormData();
	request.append('TL_AJAX', 1);

	for(var i in data) {
		request.append(i, data[i]);
	}

	var strUrl = url ? url : window.location.href;
	var strMethod = method ? method: "POST";

	const response = await fetch(strUrl, {
		method: strMethod,
		mode: 'same-origin',
		cache: 'no-cache',
		body: request
	});

	return response.json();
};

acqpa.utils.check403 = function(jqXHR, textStatus){
  if("timeout" == textStatus) {
    notif_fade.error("Erreur de communication avec le serveur.");
  }
  else if(jqXHR.status == 403) {
    notif_fade.error("Vous avez été déconnecté, la page va se rafraichir et vous devrez vous reconnecter.");
    setTimeout(function(){ location.reload(); }, 3000);
  }
  else {	
    notif.error("Erreur : " + textStatus);
  }
}

acqpa.utils.formatDate = function(date, format){
	return format
    .replace('d',date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
    .replace('m',date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) : date.getMonth()+1)
    .replace('Y',date.getFullYear())
    .replace('H',date.getHours() < 10 ? "0" + date.getHours() : date.getHours())
    .replace('i',date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
  ;
}

/** CALLBACKS **/
// acqpa.utils.callbacks = {};
acqpa.utils.callbacks.reload = function reloadPage(wait = 600) {
	setTimeout(() => { window.location.reload(false) }, wait);
}
acqpa.utils.callbacks.redirect = function redirect(url, wait = 600) {
	setTimeout(() => { window.location.replace(url) }, wait);
}
acqpa.utils.callbacks.openInNewTab = function openInNewTab(args) {
	var win = window.open();
	var title = "Document";
	var url = "";
	
	if("string" === typeof args){
		url = args;
	}else{
		title = args.title;
		url = args.url;
	}

	setTimeout(() => 	win.document.title = title,200); // otherwise doesn't work

	var x = url.split(';base64,');
	var b64 = x[1];
	var dataType = x[0].replace('data:','');

  const binStr = atob(b64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }

  const blob =  new Blob([arr], {type: dataType});
  const url2 = URL.createObjectURL(blob);
  win.document.write('<iframe src="' + url2  + '" frameborder="0" style="background-color:grey;border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}


acqpa.utils.callbacks.openUrlInNewTab = function openUrlInNewTab(url) {
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.target = "_blank";
	document.body.appendChild(a);
	a.click();
	a.remove();
}

acqpa.utils.callbacks.openModal = function openModal(args) {
	let obj = {onClose: ()=>{modal.destroy();}};
	if("undefined" === typeof args.headerSticky){
		args.headerSticky = true;
	}
	var modal = new app.ModalFW({...args,...obj});
	modal.open();
}
acqpa.utils.callbacks.openRegistrationOperatorModal = function openRegistrationOperatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		blnDismiss: args.dismiss,
		headerSticky:true,
		onOpen: () => {
			$('.registration_exam_level').first().trigger('change');
			// Useful only if the first option isn't "New operator" anymore
			// var $select = $('.select__operator').first();
			// if(!$('[name="operator[lastname]"]').val()){
			// 	$select.val($select.find('option:selected').first().val()).trigger('change');
			// }

			setTimeout(function() {
				window.dispatchEvent(new Event('resize'));
			}, 1000);
		},
		onClose: () => {
			if('registration' === args.source){
				acqpa.utils.registration.refreshRegistrationOperators();
			}else if('session' === args.source){
				acqpa.utils.session.refreshSessionOperators();
				acqpa.utils.session.refreshSessionOperatorsMissingConfigurations();
			}else if('session-manage' === args.source){
				acqpa.utils.session.refreshSessionOperatorsForManage();
				acqpa.utils.session.refreshSessionOperatorsMissingConfigurationsForManage();
			}
			modal.destroy();
		},
	});
	modal.open();
}
acqpa.utils.callbacks.refreshRegistrationOperators = function refreshRegistrationOperators() {
	acqpa.utils.registration.refreshRegistrationOperators();
}
acqpa.utils.callbacks.refreshSessionOperators = function refreshSessionOperators() {
	acqpa.utils.session.refreshSessionOperators();
}
acqpa.utils.callbacks.refreshSessionTranslators = function refreshSessionTranslators() {
	acqpa.utils.session.refreshSessionTranslators();
}
acqpa.utils.callbacks.refreshSessionExaminers = function refreshSessionExaminers() {
	acqpa.utils.session.refreshSessionExaminers();
}
acqpa.utils.callbacks.refreshSessionDocuments = function refreshSessionDocuments() {
	acqpa.utils.session.refreshSessionDocuments();
}
acqpa.utils.callbacks.refreshSessionTranslatorsMissingLanguages = function refreshSessionTranslatorsMissingLanguages() {
	acqpa.utils.session.refreshSessionTranslatorsMissingLanguages();
}
acqpa.utils.callbacks.refreshSessionExaminersMissingOptionsAndLevels = function refreshSessionExaminersMissingOptionsAndLevels() {
	acqpa.utils.session.refreshSessionExaminersMissingOptionsAndLevels();
}
acqpa.utils.callbacks.refreshSessionTranslatorsSpareLanguages = function refreshSessionTranslatorsSpareLanguages() {
	acqpa.utils.session.refreshSessionTranslatorsSpareLanguages();
}
acqpa.utils.callbacks.refreshSessionExaminersSpareOptionsAndLevels = function refreshSessionExaminersSpareOptionsAndLevels() {
	acqpa.utils.session.refreshSessionExaminersSpareOptionsAndLevels();
}
acqpa.utils.callbacks.refreshSessionOperatorsMissingConfigurations = function refreshSessionOperatorsMissingConfigurations() {
	acqpa.utils.session.refreshSessionOperatorsMissingConfigurations();
}
acqpa.utils.callbacks.refreshSessionOperatorsForManage = function refreshSessionOperatorsForManage() {
	acqpa.utils.session.refreshSessionOperatorsForManage();
}
acqpa.utils.callbacks.refreshSessionOperatorsMissingConfigurationsForManage = function refreshSessionOperatorsMissingConfigurationsForManage() {
	acqpa.utils.session.refreshSessionOperatorsMissingConfigurationsForManage();
}
acqpa.utils.callbacks.refreshAttachmentLines = function refreshAttachmentLines(args) {
	acqpa.utils.attachments.refreshAttachmentLines(args.module,args.ptable,args.entity, args.filters ?? {});
}

acqpa.utils.callbacks.openSessionTranslatorModal = function openSessionTranslatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			acqpa.utils.session.refreshSessionTranslators();
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openSessionExaminerModal = function openSessionExaminerModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			acqpa.utils.session.refreshSessionExaminers();
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openSessionDocumentModal = function openSessionDocumentModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			if(args.onclose){
				var callback = new Function (args.onclose);
				callback();
			}

			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openSendDocumentsModal = function openSendDocumentsModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			// acqpa.utils.session.refreshSessionExaminers();
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openOperatorCompanyModal = function openOperatorCompanyModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openOperatorDeduplicationModal = function openOperatorDeduplicationModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openCancelExamSessionOperatorModal = function openCancelExamSessionOperatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openRevokeCertificateModal = function openRevokeCertificateModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openSendCertificateModal = function openSendCertificateModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openExamSessionOperatorDetailModal = function openExamSessionOperatorDetailModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openExamQuestionsSummaryModal = function openExamQuestionsSummaryModal(args) {
	var modal;
	modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		intervalRefresh: setInterval(() => {
			var objFields = {
				'REQUEST_TOKEN': rt,
				'module': args.ajaxParams.module,
				'id': args.ajaxParams.id,
				'action': 'refreshModalSeeExam',
			};
			acqpa.utils.postData(objFields)
			.then(r => {
				if("error" == r.status) {
					console.log(r.msg);
				} else {
					modal.content = r.content;
					modal.setContent().then(()=>{
						if (!$('body').hasClass('firefox')) $(window).resize();
						// console.log('modal updated')
					});
				}
			})
		  .catch(err => {
		    console.log(err);
		  });
		},5000),
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			clearInterval(modal.intervalRefresh);
			modal.destroy();
		},
	});
	modal.open();
}


acqpa.utils.callbacks.openPracticalExamModal = function openPracticalExamModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openChangeOperatorPresentAtModal = function openChangeOperatorPresentAtModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openCorrectTheoricalExamModal = function openCorrectTheoricalExamModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openApplyFinalCorrectionStatusModal = function openApplyFinalCorrectionStatusModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openManagePracticalExamRedoModal = function openManagePracticalExamRedoModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		blnDismiss: false,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openAttachmentsModal = function openAttachmentsModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		blnDismiss: false,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openCertificateDetailModal = function openCertificateDetailModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.openRegistrationOperatorValidateModal = function openRegistrationOperatorValidateModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}
acqpa.utils.callbacks.openApiSireneModal = function openApiSireneModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		headerSticky:true,
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

acqpa.utils.callbacks.redirectAfterSign = function redirectAfterSign(args) {
	acqpa.utils.callbacks.redirect(args.url, args.wait ?? 600);
}

acqpa.utils.callbacks.downloadFile = function downloadFile(args) {
	var link=document.createElement('a');
  link.href=args.url;
  link.download=args.filename;
  link.click();
}

acqpa.utils.callbacks.initIntlTelInput = function initIntlTelInput(){
	acqpa.utils.intltelinput.init();
}

acqpa.utils.intltelinput.init = function(){
  const inputs = document.querySelectorAll('[type="tel"]');
  if(inputs){
  	for (let i = 0; i < inputs.length; i++) {
  		acqpa.utils.intltelinput.addInstance(inputs[i], window.intlTelInput(inputs[i], {
		  	hiddenInput:function(telInputName) {
		  		return {
			  		phone:-1 != telInputName.indexOf(']') ? telInputName.replace(']','__phone]') : telInputName+'__phone',
			  		// phone:telInputName+'__phone',
			  		// country:telInputName+'__country'
			  	}
			  }
		  }));
		  // acqpa.utils.intltelinput.instances[inputs[i].name+'_'+inputs[i].id] = window.intlTelInput(inputs[i], {
		  // 	hiddenInput:function(telInputName) {
		  // 		return {
			//   		phone:-1 != telInputName.indexOf(']') ? telInputName.replace(']','__phone]') : telInputName+'__phone',
			//   		// phone:telInputName+'__phone',
			//   		// country:telInputName+'__country'
			//   	}
			//   }
		  // });
  	}
  }
  // do not Framway Style those buttons 
  const buttons = document.querySelectorAll('.iti__selected-country');
  if(buttons){
  	for (let i = 0; i < buttons.length; i++) {
  		buttons[i].classList.add('exclude');
  	}
  }
  // do not inline-block the containers 
  const itis = document.querySelectorAll('.iti');
  if(itis){
  	for (let i = 0; i < itis.length; i++) {
  		itis[i].classList.add('iti__override');
  	}
  }
}

acqpa.utils.intltelinput.buildIdentifier = function(name, id){
	return name+'__'+id;
}

acqpa.utils.intltelinput.getInputIdentifier = function(input){
	return acqpa.utils.intltelinput.buildIdentifier(input.name, input.id);
}

acqpa.utils.intltelinput.addInstance = function(input, instance){
	acqpa.utils.intltelinput.instances[acqpa.utils.intltelinput.getInputIdentifier(input)] = instance;
}

acqpa.utils.intltelinput.getInstance = function(input){
	return acqpa.utils.intltelinput.instances[acqpa.utils.intltelinput.getInputIdentifier(input)];
}

global.acqpa = acqpa;
