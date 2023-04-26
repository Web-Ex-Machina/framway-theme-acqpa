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
			  utils.registration.saveStep(form.$sections.filter('.active'))
			  	.then(r => {
			  		form.switchStep($(this).attr('data-dir'))
			  		.then(r => {
			  			utils.registration.saveCurrentStepIndex();
			  		});
			  		notif_fade[r.status](r.msg);
			  	})
			  	.catch(err => {
			  		notif_fade.error(err);
			  	});
			}
			else if($(this).attr('data-dir') == 'final' && form.$sections.filter('.active').hasClass('complete')){ // action is final, and form is valid
			  if(checkStep.valid){
			  	utils.registration.validateRegistration()
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
           	utils.registration.saveStep(form.$sections.filter('.active'))
					  	.then(r => {
					  		form.switchStep('prev')
					  		.then(r => {
					  			utils.registration.saveCurrentStepIndex();
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
	           	utils.registration.saveStep(form.$sections.filter('.active'))
						  	.then(r => {
						  		form.switchStep('next')
						  		.then(r => {
						  			utils.registration.saveCurrentStepIndex();
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
	      blnRequest = confirm('Voulez vous vraiment supprimer ceci ?');
	    }else if('undefined' !== typeof button.data('confirm')){
	      blnRequest = confirm(button.data('confirm'));
	    }

	    if(blnRequest) {
	      utils.postData(data, url, method).then(function(r){
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
									utils.postData(data, url, method).then(function(r){
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
									utils.callbacks[i](r.callbacks[i]);
									break;
							}
						}
					}
					button.closest('.table-list__line').removeClass('loading');
	      });
	    } else {
	      button.closest('.table-list__line').removeClass('loading');
	    }
	});
});

/** REGISTRATION **/
utils.registration = {};
utils.registration.saveStep = function saveStep(step){
	var form = utils.checkForm(step);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'saveRegistration',
		// 'registration[step]': step.data('step'),
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.saveCurrentStepIndex = function saveCurrentStepIndex(){
	var form = $('.splitForm.registration').splitForm('get');
  var current = form.$sections.toArray().indexOf(form.$sections.filter('.active').get(0));
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'saveRegistration',
		'registration[step]': current,
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.refreshRegistrationOperators = function refreshRegistrationOperators(){
	$('.operators .table-list__line').remove();

	utils.registration.getRegistrationOperators()
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
utils.registration.getRegistrationOperators = function getRegistrationOperators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.getOperatorData = function getOperatorData(id){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getOperatorData',
		'id': id,
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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

utils.registration.refreshRegistrationOperatorExamLevels = function refreshRegistrationOperatorExamLevels(level, options, previouslySelectedSession){
	$('select.registration_session option').remove();
	$('select.registration_session').parent().hide();
	$('.registration_session_no_sessions').hide();

	// If there is no levels or no options, just hide stuff
	if (!level || ((1 === level || 2 === level) && !options)) {
		return;
	}

	utils.registration.getRegistrationOperatorExamSessionByLevelAndOptions(level, options, previouslySelectedSession)
	.then(r => {
		if("error" == r.status) {
			notif_fade.error(r.msg);
		} else {
			if(r.msg){
				notif_fade.success(r.msg);
			}

			if (null === r.html) {
				$('.registration_session_no_sessions').show();
			} else {
				$('select.registration_session').parent().show();
				$('select.registration_session').append(r.html);
				$('select.registration_session').trigger('change');
			}
		}
	})
  .catch(err => {
    notif_fade.error(err);
  });
}

utils.registration.getRegistrationOperatorExamSessionByLevelAndOptions = function getRegistrationOperatorExamSessionByLevelAndOptions(level, options, previouslySelectedSession){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getExamSessionByLevelAndOptions',
		'level': level,
		'options': options,
		'previouslySelectedSession': previouslySelectedSession,
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.refreshRegistrationOperatorSessionDates = function refreshRegistrationOperatorSessionDates(session, previouslySelectedDate){
	$('.registration_present_at input').remove();
	$('.registration_present_at label').remove();
	$('.registration_present_at').parent().hide();
	$('.registration_present_at_no_dates').hide();

	// If there is no session, just hide stuff
	if (!session) {
		return;
	}

	utils.registration.getRegistrationOperatorExamSessionDatesById(session, previouslySelectedDate)
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

utils.registration.getRegistrationOperatorExamSessionDatesById = function getRegistrationOperatorExamSessionDatesById(session, previouslySelectedDate){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'getExamSessionDatesById',
		'session': session,
		'previouslySelectedDate': previouslySelectedDate,
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.saveRegistrationOperator = function saveRegistrationOperator(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
		});
	}
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'saveRegistrationOperator',
	};

	var data = {};
	for (var i in form.inputs) {
		objFields[form.inputs[i].name] = form.inputs[i].value;
	}
	
	// retrieve uploaded files if any 
	// and add them to objFields 
	// additionnal AJAX options to provide :  {contentType: false,processData: false}
	if("undefined" != typeof $('input[data-name="operator[identity_picture]"]').attr('required')
	&& 0 === $('input[name="operator[identity_picture]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('La photo d\'identité n\'a pas été fournie');
		});
	}
	if(0 !== $('input[name="operator[identity_picture]"]').length){
		objFields['operator[identity_picture]'] = $('input[name="operator[identity_picture]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="operator[identity_piece]"]').attr('required')
	&& 0 === $('input[name="operator[identity_piece]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('La pièce d\'identité n\'a pas été fournie');
		});
	}
	if(0 !== $('input[name="operator[identity_piece]"]').length){
		objFields['operator[identity_piece]'] = $('input[name="operator[identity_piece]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="operator[cv]"]').attr('required')
	&& 0 === $('input[name="operator[cv]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('Le CV n\'a pas été fourni');
		});
	}
	if(0 !== $('input[name="operator[cv]"]').length){
		objFields['operator[cv]'] = $('input[name="operator[cv]"]')[0].value;
	}

	if("undefined" != typeof $('input[data-name="registration[employer_certificate]"]').attr('required')
	&& 0 === $('input[name="registration[employer_certificate]"]').length
	){
		return new Promise(function (resolve, reject) {
			reject('Le certificat employeur n\'a pas été fourni');
		});
	}
	if(0 !== $('input[name="registration[employer_certificate]"]').length){
		objFields['registration[employer_certificate]'] = $('input[name="registration[employer_certificate]"]')[0].value;
	}

	if((1 == objFields['registration[exam_level]'] || 2 == objFields['registration[exam_level]'])
		&& 0 == objFields['registration[exam_options]'].length
	){
		return new Promise(function (resolve, reject) {
			reject('Veuillez sélectionner au moins une option');
		});
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
			reject('L \'opérateur doit être majeur pour être inscrit.');
		});
	}



	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.validateRegistration = function validateRegistration(modal){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'validateRegistration',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.registration.confirmRegistration = function confirmRegistration(modal){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_company_edit_registration',
		'action': 'confirmRegistration',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.session = {};
utils.session.refreshSessionTranslators = function refreshSessionTranslators(){
	$('.translators .table-list__line').remove();

	utils.session.getSessionTranslators()
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
utils.session.getSessionTranslators = function getSessionTranslators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getTranslators',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.session.saveExamSessionTranslator = function saveExamSessionTranslator(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
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
		utils.postData(objFields)
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
utils.session.refreshSessionExaminers = function refreshSessionExaminers(){
	$('.examiners .table-list__line').remove();

	utils.session.getSessionExaminers()
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
utils.session.getSessionExaminers = function getSessionExaminers(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getExaminers',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.session.saveExamSessionExaminer = function saveExamSessionExaminer(modal){
	var form = utils.checkForm(modal);
	if(!form.valid){
		return new Promise(function (resolve, reject) {
			reject('Veuillez remplir le formulaire');
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
		utils.postData(objFields)
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
utils.session.refreshSessionOperators = function refreshSessionOperators(){
	$('.operators .table-list__line').remove();

	utils.session.getRegistrationOperators()
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
utils.session.getRegistrationOperators = function getRegistrationOperators(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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

utils.session.refreshSessionExaminersMissingOptionsAndLevels = function refreshSessionExaminersMissingOptionsAndLevels(){
	$('#exam-session-examiners-missing').html('');

	utils.session.getSessionExaminersMissingOptionsAndLevels()
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
utils.session.getSessionExaminersMissingOptionsAndLevels = function getSessionExaminersMissingOptionsAndLevels(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionExaminersMissingOptionsAndLevels',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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

utils.session.refreshSessionExaminersSpareOptionsAndLevels = function refreshSessionExaminersSpareOptionsAndLevels(){
	$('#exam-session-examiners-spare').html('');

	utils.session.getSessionExaminersSpareOptionsAndLevels()
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
utils.session.getSessionExaminersSpareOptionsAndLevels = function getSessionExaminersSpareOptionsAndLevels(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionExaminersSpareOptionsAndLevels',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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


utils.session.refreshSessionTranslatorsMissingLanguages = function refreshSessionTranslatorsMissingLanguages(){
	$('#exam-session-translators-missing').html('');

	utils.session.getSessionTranslatorsMissingLanguages()
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
utils.session.getSessionTranslatorsMissingLanguages = function getSessionTranslatorsMissingLanguages(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionTranslatorsMissingLanguages',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.session.refreshSessionTranslatorsSpareLanguages = function refreshSessionTranslatorsSpareLanguages(){
	$('#exam-session-translators-spare').html('');

	utils.session.getSessionTranslatorsSpareLanguages()
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
utils.session.getSessionTranslatorsSpareLanguages = function getSessionTranslatorsSpareLanguages(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionTranslatorsSpareLanguages',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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

utils.session.refreshSessionOperatorsMissingConfigurations = function refreshSessionOperatorsMissingConfigurations(){
	$('#exam-session-operator-configuration-missing').html('');

	utils.session.getSessionOperatorsMissingConfigurations()
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
utils.session.getSessionOperatorsMissingConfigurations = function getSessionOperatorsMissingConfigurations(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_edit',
		'action': 'getSessionOperatorsMissingConfigurations',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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

utils.session.refreshSessionOperatorsForManage = function refreshSessionOperatorsForManage(){
	utils.session.getRegistrationOperatorsForManage()
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
utils.session.getRegistrationOperatorsForManage = function getRegistrationOperatorsForManage(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_manage',
		'action': 'getOperators',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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



utils.session.refreshSessionOperatorsMissingConfigurationsForManage = function refreshSessionOperatorsMissingConfigurationsForManage(){
	$('#exam-session-operator-configuration-missing').html('');

	utils.session.getSessionOperatorsMissingConfigurationsForManage()
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
utils.session.getSessionOperatorsMissingConfigurationsForManage = function getSessionOperatorsMissingConfigurationsForManage(){
	var objFields = {
		'REQUEST_TOKEN': rt,
		'module_type': 'acqpa_exam_session_manage',
		'action': 'getSessionOperatorsMissingConfigurations',
	};

	return new Promise(function (resolve, reject) {
		utils.postData(objFields)
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
utils.postData = async function postData(data, url = "", method = "POST") {
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

utils.check403 = function(jqXHR, textStatus){
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

utils.formatDate = function(date, format){
	return format
    .replace('d',date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
    .replace('m',date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) : date.getMonth()+1)
    .replace('Y',date.getFullYear())
    .replace('H',date.getHours() < 10 ? "0" + date.getHours() : date.getHours())
    .replace('i',date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
  ;
}

/** CALLBACKS **/
utils.callbacks = {};
utils.callbacks.reload = function reloadPage(wait = 600) {
	setTimeout(() => { window.location.reload(false) }, wait);
}
utils.callbacks.redirect = function redirect(url, wait = 600) {
	setTimeout(() => { window.location.replace(url) }, wait);
}
utils.callbacks.openInNewTab = function openInNewTab(url) {
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.target = "_blank";
	document.body.appendChild(a);
	a.click();
	a.remove();
}
utils.callbacks.openModal = function openModal(args) {
	var modal = new app.ModalFW(args);
	modal.open();
}
utils.callbacks.openRegistrationOperatorModal = function openRegistrationOperatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		blnDismiss: args.dismiss,
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
				utils.registration.refreshRegistrationOperators();
			}else if('session' === args.source){
				utils.session.refreshSessionOperators();
				utils.session.refreshSessionOperatorsMissingConfigurations();
			}else if('session-manage' === args.source){
				utils.session.refreshSessionOperatorsForManage();
				utils.session.refreshSessionOperatorsMissingConfigurationsForManage();
			}
			modal.destroy();
		},
	});
	modal.open();
}
utils.callbacks.refreshRegistrationOperators = function refreshRegistrationOperators() {
	utils.registration.refreshRegistrationOperators();
}
utils.callbacks.refreshSessionOperators = function refreshSessionOperators() {
	utils.session.refreshSessionOperators();
}
utils.callbacks.refreshSessionTranslators = function refreshSessionTranslators() {
	utils.session.refreshSessionTranslators();
}
utils.callbacks.refreshSessionExaminers = function refreshSessionExaminers() {
	utils.session.refreshSessionExaminers();
}
utils.callbacks.refreshSessionTranslatorsMissingLanguages = function refreshSessionTranslatorsMissingLanguages() {
	utils.session.refreshSessionTranslatorsMissingLanguages();
}
utils.callbacks.refreshSessionExaminersMissingOptionsAndLevels = function refreshSessionExaminersMissingOptionsAndLevels() {
	utils.session.refreshSessionExaminersMissingOptionsAndLevels();
}
utils.callbacks.refreshSessionTranslatorsSpareLanguages = function refreshSessionTranslatorsSpareLanguages() {
	utils.session.refreshSessionTranslatorsSpareLanguages();
}
utils.callbacks.refreshSessionExaminersSpareOptionsAndLevels = function refreshSessionExaminersSpareOptionsAndLevels() {
	utils.session.refreshSessionExaminersSpareOptionsAndLevels();
}
utils.callbacks.refreshSessionOperatorsMissingConfigurations = function refreshSessionOperatorsMissingConfigurations() {
	utils.session.refreshSessionOperatorsMissingConfigurations();
}
utils.callbacks.refreshSessionOperatorsForManage = function refreshSessionOperatorsForManage() {
	utils.session.refreshSessionOperatorsForManage();
}
utils.callbacks.refreshSessionOperatorsMissingConfigurationsForManage = function refreshSessionOperatorsMissingConfigurationsForManage() {
	utils.session.refreshSessionOperatorsMissingConfigurationsForManage();
}

utils.callbacks.openSessionTranslatorModal = function openSessionTranslatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			utils.session.refreshSessionTranslators();
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openSessionExaminerModal = function openSessionExaminerModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			utils.session.refreshSessionExaminers();
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openSendDocumentsModal = function openSendDocumentsModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			// $('.registration_exam_level').trigger('change');
		},
		onClose: () => {
			// utils.session.refreshSessionExaminers();
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openOperatorCompanyModal = function openOperatorCompanyModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openOperatorDeduplicationModal = function openOperatorDeduplicationModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openCancelExamSessionOperatorModal = function openCancelExamSessionOperatorModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openRevokeCertificateModal = function openRevokeCertificateModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openSendCertificateModal = function openSendCertificateModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openExamSessionOperatorDetailModal = function openExamSessionOperatorDetailModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openExamQuestionsSummaryModal = function openExamQuestionsSummaryModal(args) {
	var modal;
	modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		intervalRefresh: setInterval(() => {
			var objFields = {
				'REQUEST_TOKEN': rt,
				'module': args.ajaxParams.module,
				'id': args.ajaxParams.id,
				'action': 'refreshModalSeeExam',
			};
			utils.postData(objFields)
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


utils.callbacks.openPracticalExamModal = function openPracticalExamModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openChangeOperatorPresentAtModal = function openChangeOperatorPresentAtModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openCorrectTheoricalExamModal = function openCorrectTheoricalExamModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.openApplyFinalCorrectionStatusModal = function openApplyFinalCorrectionStatusModal(args) {
	var modal = new app.ModalFW({
		name: args.name,
		content: args.content,
		width: args.width,
		title: args.title ?? '',
		onOpen: () => {
			$(window).resize();
		},
		onClose: () => {
			modal.destroy();
		},
	});
	modal.open();
}

utils.callbacks.redirectAfterSign = function redirectAfterSign(args) {
	utils.callbacks.redirect(args.url, args.wait ?? 600);
}

utils.callbacks.downloadFile = function downloadFile(args) {
	var link=document.createElement('a');
  link.href=args.url;
  link.download=args.filename;
  link.click();
}

