/*
 * A joomla 3 Simple auto-cropping responsive slider v0.1.0
 *
 * Copyright 2014, jpeg729
 * Released under the GNU General Public License version 2 or later.
 *
 * July 2014
 * 
 * Based on jQuery Nivo Slider v3.2
 * http://nivo.dev7studios.com
 *
 * Copyright 2012, Dev7studios
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

(function($) {
  var NivoSlider = function(element, options){
    // Defaults are below
    var settings = $.extend({}, $.fn.jpegSlider.defaults, options);

    // Useful variables. Play carefully.
    var vars = {
      currentSlide: 0,
      currentImage: '',
      totalSlides: 0,
      dimens: [],
      running: false,
      paused: false,
      stop: false,
      controlNavEl: false,
      ie: false
    };
    
    var debug = function(message, clear){
      if (clear) { $('#jpegDebug', slider).html('') };
      if ($('#jpegDebug', slider)[0] === undefined) {
        slider.append('<div id="jpegDebug" style="position:fixed;top:10px;left:10px;background:white;" />');
      }
      $('#jpegDebug', slider).append(message + ' ');
    }

    // Get this slider
    var slider = $(element);
    slider.data('nivo:vars', vars).addClass('nivoSlider');
    ie = slider.parent().hasClass('ie');
    
    var sliderHeight = slider.innerHeight(),
        sliderWidth = slider.innerWidth(),
        sliderProportion = sliderHeight / sliderWidth;
    
    // Calculate good numbers for slices and boxes
    settings.slices = Math.round(sliderWidth / settings.sliceWidth);
    settings.boxRows = Math.round(sliderHeight / settings.boxSize);
    settings.boxCols = Math.round(sliderWidth / settings.boxSize);

    // Find our slider children
    var kids = slider.children();
    kids.each(function() {
      var child = $(this);
      var link = '';
      if(!child.is('img')){
        if(child.is('a')){
          child.addClass('nivo-imageLink');
          link = child;
        }
        child = child.find('img:first');
      }
      
      // Get img width & height
      var childHeight = child.height(),
          childWidth = child.width(),
          childProportion = childHeight / childWidth;
      
      vars.dimens[vars.totalSlides] = {
        width_ratio: 1, // 1 means exactly the same width as the slider
        height_ratio: 1,
        top: 0,
        left: 0
      };
      
      var offset;
      if (childProportion >= sliderProportion) {
        // Center vertically
        offset = (sliderHeight - childHeight) / 2;
        child.css({
          top: offset,
          left: 0
        });
        vars.dimens[vars.totalSlides].top = offset;
        vars.dimens[vars.totalSlides].height_ratio = childHeight / sliderHeight;
        
      } else {
        // Fill available height and center horizontally
        if (childHeight != sliderHeight) {
          // The image has not yet been adjusted
          childWidth = (sliderHeight / childHeight) * childWidth;
          childHeight = sliderHeight;
        }
        offset = (sliderWidth - childWidth) / 2;
        child.css({
          height: '100%',
          width: 'auto',
          top: 0,
          left: offset
        });
        vars.dimens[vars.totalSlides].left = offset;
        vars.dimens[vars.totalSlides].width_ratio = childWidth / sliderWidth;
      }
      
      if(link !== ''){
          link.css('display','none');
      }
      child.css('display','none');
      vars.totalSlides++;
    });
     
    // If randomStart
    if(settings.randomStart){
      settings.startSlide = Math.floor(Math.random() * vars.totalSlides);
    }
    
    // Set startSlide
    if(settings.startSlide > 0){
      if(settings.startSlide >= vars.totalSlides) { settings.startSlide = vars.totalSlides - 1; }
      vars.currentSlide = settings.startSlide;
    }
    
    // Get initial image
    if($(kids[vars.currentSlide]).is('img')){
      vars.currentImage = $(kids[vars.currentSlide]);
    } else {
      vars.currentImage = $(kids[vars.currentSlide]).find('img:first');
    }
    
    // Show initial link
    if($(kids[vars.currentSlide]).is('a')){
      $(kids[vars.currentSlide]).css('display','block');
    }
    
    // Set first background
    var sliderImg = vars.currentImage.clone().addClass('nivo-main-image').show();
    slider.append(sliderImg);
    
    // Set background
    var setBg = function(){
      var image = vars.currentImage;
      sliderImg.attr('src', image.attr('src'));
      sliderImg.css({
        width: slider.width() * vars.dimens[vars.currentSlide].width_ratio,
        height: slider.innerHeight() * vars.dimens[vars.currentSlide].height_ratio,
        top: vars.dimens[vars.currentSlide].top,
        left: vars.dimens[vars.currentSlide].left
      });
    }

    // Detect Window Resize
    $(window).resize(function() {
      setBg(vars.currentImage);
      sliderImg.stop();
      $('.nivo-slice').remove();
      $('.nivo-box').remove();
    });

    //Create caption
    slider.append($('<div class="nivo-caption"></div>'));
    
    // Process caption function
    var processCaption = function(settings){
      var nivoCaption = $('.nivo-caption', slider);
      if(vars.currentImage.attr('title') != '' && vars.currentImage.attr('title') != undefined){
        var title = vars.currentImage.attr('title');
        if(title.substr(0,1) == '#') title = $(title).html();

        if(nivoCaption.css('display') == 'block'){
          setTimeout(function(){
            nivoCaption.html(title);
          }, settings.animTime);
        } else {
          nivoCaption.html(title);
          nivoCaption.stop().fadeIn(settings.animTime);
        }
      } else {
        nivoCaption.stop().fadeOut(settings.animTime);
      }
    }
    
    //Process initial  caption
    processCaption(settings);
    
    // In the words of Super Mario "let's a go!"
    var timer = 0;
    if(!settings.manualAdvance && kids.length > 1){
      timer = setTimeout(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
    }
    
    // Add Direction nav
    if(settings.directionNav){
      slider.append('<div class="nivo-directionNav"><a class="nivo-prevNav">'+ settings.prevText +'</a><a class="nivo-nextNav">'+ settings.nextText +'</a></div>');
      
      $(slider).on('click', 'a.nivo-prevNav', function(){
        if(vars.running) { return false; }
        clearTimeout(timer);
        timer = '';
        vars.currentSlide -= 2;
        nivoRun(slider, kids, settings, 'prev');
      });
      
      $(slider).on('click', 'a.nivo-nextNav', function(){
        if(vars.running) { return false; }
        clearTimeout(timer);
        timer = '';
        setBg(vars.currentImage);
        nivoRun(slider, kids, settings, 'next');
      });
    }
    
    // Add Control nav
    if(settings.controlNav){
      vars.controlNavEl = $('<div class="nivo-controlNav"></div>');
      slider.after(vars.controlNavEl);
      for(var i = 0; i < kids.length; i++){
        if(settings.controlNavThumbs){
          vars.controlNavEl.addClass('nivo-thumbs-enabled');
          var child = kids.eq(i);
          if(!child.is('img')){
            child = child.find('img:first');
          }
          if(child.attr('data-thumb')) vars.controlNavEl.append('<a class="nivo-control" rel="'+ i +'"><img src="'+ child.attr('data-thumb') +'" alt="" /></a>');
        } else {
          vars.controlNavEl.append('<a class="nivo-control" rel="'+ i +'">'+ (i + 1) +'</a>');
        }
      }

      //Set initial active link
      $('a:eq('+ vars.currentSlide +')', vars.controlNavEl).addClass('active');
      
      $('a', vars.controlNavEl).bind('click', function(){
        if(vars.running) return false;
        if($(this).hasClass('active')) return false;
        clearTimeout(timer);
        timer = '';
        setBg(vars.currentImage);
        vars.currentSlide = $(this).attr('rel') - 1;
        nivoRun(slider, kids, settings, 'control');
      });
    }
    
    //For pauseOnHover setting
    if(settings.pauseOnHover){
      slider.hover(function(){
        vars.paused = true;
        clearTimeout(timer);
        timer = '';
      }, function(){
        vars.paused = false;
        // Restart the timer
        if(timer === '' && !settings.manualAdvance && !vars.running){
          timer = setTimeout(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
        }
      });
    }
    
    // Event when Animation finishes
    slider.bind('nivo:animFinished', function(){
      if (!vars.running) return;
      vars.running = false;
      setBg(vars.currentImage);
      // Hide child links
      $(kids).each(function(i){
        if($(this).is('a')){
          $(this).css('display',i == vars.currentSlide ? 'block' : 'none');
        }
      });
      // Show current link
      if($(kids[vars.currentSlide]).is('a')){
        $(kids[vars.currentSlide]).css('display','block');
      }
      // Restart the timer
      if(timer === '' && !vars.paused && !settings.manualAdvance){
        timer = setTimeout(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
      }
      // Trigger the afterChange callback
      settings.afterChange.call(this);
    });
    
    // Add slices for slice animations
    var createSlices = function(slider, slices, vars) {
      if($(vars.currentImage).parent().is('a')) $(vars.currentImage).parent().css('display','block');
      $('img[src="'+ vars.currentImage.attr('src') +'"]', slider).not('.nivo-main-image,.nivo-control img').css('visibility', 'hidden').show();
      
      var height = slider.innerHeight();

      for(var i = 0; i < slices; i++){
        var sliceWidth = Math.round(slider.width()/slices);
        
        var width;
        if(i === slices-1){
          width = (slider.width()-(sliceWidth*i));
        } else {
          width = sliceWidth;
        }
        
        slice = $('<div class="nivo-slice" name="'+i+'"></div>').css({
          top:      0,
          left:    (sliceWidth*i),
          width:    width,
          height:   height,
          opacity: '0',
          overflow:'hidden'
        });
        
        slice.append("<span><img src=\"" + vars.currentImage.attr('src') + "\" alt=\"\"/></span>");
        sliceImageStyle = {
          position:'absolute',
          display: 'block !important',
          width:    slider.width() * vars.dimens[vars.currentSlide].width_ratio,
          height:   height * vars.dimens[vars.currentSlide].height_ratio,
          left:     vars.dimens[vars.currentSlide].left - (sliceWidth*i),
          top:      vars.dimens[vars.currentSlide].top
        };
        slice.find('img').css(sliceImageStyle);
        
        slider.append(slice);
      }
    };
    
    // Add boxes for box animations
    var createBoxes = function(slider, settings, vars){
      if($(vars.currentImage).parent().is('a')) $(vars.currentImage).parent().css('display','block');
      $('img[src="'+ vars.currentImage.attr('src') +'"]', slider).not('.nivo-main-image,.nivo-control img').width(slider.width()).css('visibility', 'hidden').show();
      var boxWidth  = Math.round(slider.width() / settings.boxCols),
          boxHeight = Math.round(slider.innerHeight() / settings.boxRows);
      
      for(var rows = 0; rows < settings.boxRows; rows++){
        for(var cols = 0; cols < settings.boxCols; cols++){
          var width;
          if(cols === settings.boxCols-1){
            width = (slider.width()-(boxWidth*cols));
          } else {
            width = boxWidth;
          }
      
          box = $('<div class="nivo-box" name="'+ cols +'" rel="'+ rows +'"></div>').css({
            opacity:0,
            left:  (boxWidth*cols),
            top:   (boxHeight*rows),
            width:  width,
            height: boxHeight
          });
          
          box.append("<span><img src='" + vars.currentImage.attr('src') + "' alt=''/></span>");
          boxImageStyle = {
            position:'absolute',
            display: 'block !important',
            width:    slider.width()    *    vars.dimens[vars.currentSlide].width_ratio,
            height:   slider.innerHeight() * vars.dimens[vars.currentSlide].height_ratio,
            left:     vars.dimens[vars.currentSlide].left - (boxWidth*cols),
            top:      vars.dimens[vars.currentSlide].top - (boxHeight*rows)
          };
          box.find('img').css(boxImageStyle);
          
          slider.append(box);
        }
      }
    };

    // Private run method
    var nivoRun = function(slider, kids, settings, nudge){
      // Get our vars
      var vars = slider.data('nivo:vars');
      
      // Clear the timer
      clearTimeout(timer);
      timer = '';
      
      // Trigger the lastSlide callback
      if(vars && (vars.currentSlide === vars.totalSlides - 1)){
        settings.lastSlide.call(this);
      }
      
      // Stop
      if((!vars || vars.stop) && !nudge) { return false; }
      
      // Trigger the beforeChange callback
      settings.beforeChange.call(this);

      // Set current background before change
      if(!nudge || nudge == 'next'){
        setBg(vars.currentImage);
      }
      
      vars.currentSlide++;
      // Trigger the slideshowEnd callback
      if(vars.currentSlide === vars.totalSlides){
        vars.currentSlide = 0;
        settings.slideshowEnd.call(this);
      }
      if(vars.currentSlide < 0) { vars.currentSlide = (vars.totalSlides - 1); }
      // Set vars.currentImage
      if($(kids[vars.currentSlide]).is('img')){
        vars.currentImage = $(kids[vars.currentSlide]);
      } else {
        vars.currentImage = $(kids[vars.currentSlide]).find('img:first');
      }
      
      // Set active links
      if(settings.controlNav){
        $('a', vars.controlNavEl).removeClass('active');
        $('a:eq('+ vars.currentSlide +')', vars.controlNavEl).addClass('active');
      }
      
      // Process caption
      processCaption(settings);
      
      // Remove any slices from last transition
      $('.nivo-slice', slider).remove();
      
      // Remove any boxes from last transition
      $('.nivo-box', slider).remove();
      
      var currentEffect;
      
      // Choose at random from specified set of effects (eg: effect:'fold,fade')
      currentEffect = choose(settings.effect.split(','));
      
      // Custom transition as defined by "data-transition" attribute
      if(vars.currentImage.attr('data-transition')){
        currentEffect = vars.currentImage.attr('data-transition');
      }
      
      var userAgent = window.navigator.userAgent;
      if (currentEffect === undefined) {
        currentEffect = new Array('full','fade');
      } else if (userAgent.indexOf('MSIE ') > 0 || userAgent.indexOf('Trident/') > 0) {
        /*
         * IE complains loudly about obscure random errors thrown by
         * jQuery's animate function so we just stick to fading the
         * whole image. That works well enough.
         * ('Trident/' is for IE 11+)
         * 
         * I've tried encasing the calls to animate within try-catch
         * blocks, but that halts the animation and skips the
         * on-complete function. jQuery seems to cope well enough on
         * its own, however IE will bug the user about errors in
         * javascript.
         */
        currentEffect = new Array('full','fade');
      } else {
        currentEffect = currentEffect.split('-');
      }
      
      var anims = new Array('slice','box','full');
      if ($.inArray(currentEffect[0], anims) == -1) {
        currentEffect[0] = choose(anims);
      }
  
      // Run effects
      vars.running = true;
      var timeBuff = 0,
          i = 0,
          slices,
          firstSlice,
          totalBoxes = settings.boxCols * settings.boxRows,
          boxes;
      
      if(currentEffect[0] === 'slice'){
        createSlices(slider, settings.slices, vars);
        
        var anims = new Array('up','down','both','fold','fade');
        if ($.inArray(currentEffect[1], anims) == -1) {
          currentEffect[1] = choose(anims);
        }
        
        while (slices === undefined) {
          switch(currentEffect[2]) {
            case 'left':
              slices = $('.nivo-slice', slider)._reverse();
              break;
            case 'right':
              slices = $('.nivo-slice', slider);
              break
            case 'random':
              slices = shuffle($('.nivo-slice', slider));
              break;
            case 'out':
              slices = middleFirst($('.nivo-slice', slider));
              break;
            case 'in':
              slices = endsFirst($('.nivo-slice', slider));
              break;
            default:
              currentEffect[2] = choose(new Array('left','right','random','out','in'));
          }
        }
        
        slices.each(function(){
          var slice = $(this);
          var direction = currentEffect[1];
          if (direction === 'both') {
            direction = 'up';
            if (currentEffect[2] === 'in' || currentEffect[2] === 'out') {
              if ( i >> 2 == (i >> 1)/2 ) {
                direction = 'down';
              }
            } else if (i >> 1 == i / 2  ) {
              direction = 'down';
            }
          }
          animateSlice(slice, direction, settings.animTime, timeBuff, i === settings.slices-1);
          timeBuff += 50;
          i++;
        });
      } else if(currentEffect[0] === 'box'){
        createBoxes(slider, settings, vars);
        
        var anims = new Array('grow','fade');
        if ($.inArray(currentEffect[1], anims) == -1) {
          currentEffect[1] = choose(anims);
        }
        
        while (boxes === undefined) {
          switch(currentEffect[2]) {
            case 'left':
              boxes = $('.nivo-box', slider)._reverse();
              break;
            case 'right':
              boxes = $('.nivo-box', slider);
              break
            case 'random':
              boxes = shuffle($('.nivo-box', slider));
              break;
            case 'out':
              boxes = middleFirst($('.nivo-box', slider));
              break;
            case 'in':
              boxes = endsFirst($('.nivo-box', slider));
              break;
            default:
              currentEffect[2] = choose(new Array('left','right','random','out','in'));
          }
        }
        
        if (currentEffect[2] === 'random' || currentEffect[2] === 'out' || currentEffect[2] === 'in') {
          boxes.each(function(){
            var box = $(this);
            animateBox(box, currentEffect[1], settings.animTime, timeBuff, i === totalBoxes-1);
            timeBuff += 20;
            i++;
          });
        } else {
          // Split boxes into 2D array
          var rowIndex = 0;
          var colIndex = 0;
          var box2Darr = [];
          box2Darr[rowIndex] = [];
          boxes.each(function(){
            box2Darr[rowIndex][colIndex] = $(this);
            colIndex++;
            if(colIndex === settings.boxCols){
              rowIndex++;
              colIndex = 0;
              box2Darr[rowIndex] = [];
            }
          });
          // Run animation progressing by diagonal lines
          for(var col = 0; col < (settings.boxCols * 2); col++){
            var prevCol = col;
            for(var row = 0; row < settings.boxRows; row++){
              if(prevCol >= 0 && prevCol < settings.boxCols){
                animateBox($(box2Darr[row][prevCol]), currentEffect[1], settings.animTime, timeBuff, i === totalBoxes-1);
                i++;
              }
              prevCol--;
            }
            timeBuff += 100;
          }
        }
      } else if(currentEffect[0] === 'full'){
        createSlices(slider, 1, vars);
        
        slice = $('.nivo-slice:first', slider);
        
        var anims = new Array('fade','right','left');
        if ($.inArray(currentEffect[1], anims) == -1) {
          currentEffect[1] = choose(anims);
        }
        
        switch (currentEffect[1]) {
          case 'fade':
            // no special preparation needed
            break;
          case 'left':
            slice.css({ 'left': slider.width() });
            // Animate image left at the same time to keep the image still
            var l = vars.dimens[vars.currentSlide].left;
            var img = slice.find('img').css({ 'left': l - slider.width() }).animate({ 'left': l }, (settings.animTime*2));
            
            break;
          case 'right':
            slice.css({ 'width': '0' });
            break;
        }
        
        slice.animate({ opacity:'1', width: slider.width(), left: 0 }, (settings.animTime*2),
            '', function(){ slider.trigger('nivo:animFinished'); });
      }
    };
    
    var animateSlice = function(slice, type, speed, timeBuff, last){
      var h = slider.innerHeight();
      var w = slice.width();
      var img = slice.find('img');
      var t = vars.dimens[vars.currentSlide].top;
      
      if (type === 'up') {
        img.css({ top: t - h });
        setTimeout(function(){
          img.animate({ top: t }, speed);
        }, (100 + timeBuff));
        
        slice.css({ top: h, height: '0' });
        
      } else if (type === 'down' ){
        slice.css({ height: '0' });
        
      } else if (type === 'fold' ){
        slice.css({ width: '0' });
        
      } // else type === 'fade'
      
      if(last){
        setTimeout(function(){
          slice.animate({ opacity:'1', top: '0', width:w, height:h }, speed, '', function(){ slider.trigger('nivo:animFinished'); });
        }, (100 + timeBuff));
      } else {
        setTimeout(function(){
          slice.animate({ opacity:'1', top: '0', width:w, height:h }, speed);
        }, (100 + timeBuff));
      }
    };
    
    var animateBox = function(box, type, speed, timeBuff, last){
      var w = box.width();
      var h = box.height();
      
      if (type === 'grow') {
        box.width(0).height(0);
      } // else fade
      
      if(last){
        setTimeout(function(){
          box.animate({ opacity:'1', width:w, height:h }, speed, '', function(){ slider.trigger('nivo:animFinished'); });
        }, (100 + timeBuff));
      } else {
        setTimeout(function(){
          box.animate({ opacity:'1', width:w, height:h }, speed);
        }, (100 + timeBuff));
      }
    };
    
    // Shuffle an array
    var shuffle = function(arr){
      for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i, 10), x = arr[--i], arr[i] = arr[j], arr[j] = x);
      return arr;
    };
    
    var middleFirst = function(arr){
      var muddled = [], l, r;
      l = r = arr.length >> 1;
      for(var i = 0; i < arr.length; muddled[i++] = arr[r++], muddled[i++] = arr[--l]);
      return $(muddled);
    };
    
    var endsFirst = function(arr){
      var muddled = [], l, r;
      l = r = arr.length >> 1;
      for(var i = arr.length; i >=0; muddled[i--] = arr[r++], muddled[i--] = arr[--l]);
      return $(muddled);
    };
    
    // Random choice function
    var choose = function(arr){
      return arr[Math.floor(Math.random()*arr.length)];
    };
    
    // For debugging
    var trace = function(msg){
      if(this.console && typeof console.log !== 'undefined') { console.log(msg); }
    };
    
    // Start / Stop
    this.stop = function(){
      if(!$(element).data('nivo:vars').stop){
        $(element).data('nivo:vars').stop = true;
        trace('Stop Slider');
      }
    };
    
    this.start = function(){
      if($(element).data('nivo:vars').stop){
        $(element).data('nivo:vars').stop = false;
        trace('Start Slider');
      }
    };
    
    // Trigger the afterLoad callback
    settings.afterLoad.call(this);
    
    return this;
  };
      
  $.fn.jpegSlider = function(options) {
    return this.each(function(key, value){
      var element = $(this);
      // Return early if this element already has a plugin instance
      if (element.data('nivoslider')) { return element.data('nivoslider'); }
      // Pass options to plugin constructor
      var nivoslider = new NivoSlider(this, options);
      // Store plugin object in this element's data
      element.data('nivoslider', nivoslider);
    });
  };
  
  /* 
   * Effects: provide a comma separated list, choosing one from each set
   * of brackets
   * 
   * full-[fade|right|left]
   * slice-[up|down|both|fold|fade]-[left|right|in|out|random]
   * box-[grow|fade]-[left|right|in|out|random]
   * 
   * e.g. slice-up-right,full-fade,box-grow-random
   * 
   * Shortcuts and wildcards are possible
   * 
   * slice-*-right means change by slices from left to right using any 
   * type of animation for each slice
   * 
   * box-grow means change by boxes that grow in any order
   * 
   * Any effect that isn't in the above lists will be replaced by a 
   * random choice.
   */
  
  // Default settings
  $.fn.jpegSlider.defaults = {
    effect: 'random',
    sliceWidth: 50,
    boxSize: 80,
    animTime: 500, // very approximative
    pauseTime: 3000,
    startSlide: 0,
    directionNav: true,
    controlNav: false,
    controlNavThumbs: false,
    pauseOnHover: true,
    manualAdvance: false,
    prevText: 'Prev',
    nextText: 'Next',
    randomStart: false,
    beforeChange: function(){},
    afterChange: function(){},
    slideshowEnd: function(){},
    lastSlide: function(){},
    afterLoad: function(){}
  };

  $.fn._reverse = [].reverse;
    
})(jQuery);
