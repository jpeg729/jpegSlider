# jpegSlider #

The jpegSlider is an image slideshow based on the well-known NivoSlider jQuery Plugin

It is designed to be super easy to use. It is fully responsive, and automatically 
adjusts the images to fit. The transition effects have been redesigned to be 
fancy and yet discrete. There are no image parts that move around, they grow in to 
place or fade away discretely.

## Features ##

* fully responsive
* it keeps its proportions no matter what size the browser window is
* it also resizes, centers and crops the images to fit
* no loading image, without javascript the first image is visible, though not necessarily
well adjusted since that requires javascript - unless you use the joomla version.

## How to use in joomla ##

Install and enable the plugin, then add the following text to any article.

    {slider "/path/to/image/folder" 700x350}

**Easy wasn't it**

The width and height must be specified in pixels (for now).

You can also use it in a module with custom content.

The joomla plugin doesn't yet support passing options to the slider.


## How to use without joomla ##

The use of padding-top for the slider guarantees the slider will keep its
proportions no matter what size the browser window is. If you specify a 
percentage, it will be calculated relative to the *width* of the parent window.
Apparently that avoids some recursive situations.

For example, if the width of the wrapper is 700, and the padding-top of the 
slider is 50.42%, the height of the slider will be 700*0.5042 = ~353 pixels.

Obviously, you can use whatever units you like for the wrapper's width. 
The pixels only limitation, only applies to the plugin.

    <!DOCTYPE html>
    <html lang="fr-fr" dir="ltr">
    
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>jpegSlider demo</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <link rel="stylesheet" href="media/jpegSlider.css" type="text/css" media="screen" />
      
      <!--[if lt IE 9]>
        <script src="/media/jui/js/html5.js"></script>
      <![endif]-->
      
      <style>
        .nivoSlider-wrapper {
          max-width: 700px;
        }
        #slider {
          padding-top: 50.42%;
        }
      </style>
      
    </head>
    <body>
        <div id="wrapper">
          <div class="nivoSlider-wrapper theme-default">
            <div id="slider" class="nivoSlider">
              <img src="images/toystory.jpg" data-thumb="images/toystory.jpg" alt="" />
              <img src="images/up.jpg" data-thumb="images/up.jpg" alt="" title="This is an example of a caption" />
              <img src="images/walle.jpg" data-thumb="images/walle.jpg" alt="" />
              <img src="images/nemo.jpg" data-thumb="images/nemo.jpg" alt="" />
            </div>
          </div>
        </div>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
        <script type="text/javascript" src="media/jpegSlider.js"></script>
        <script type="text/javascript">
        $(window).load(function() {
            jQuery('#slider').jpegSlider();
        });
        </script>
    </body>
    </html>

## Transition effects ##

I have largely refactored and improved the whole effects system.
Images transition either as a whole, or by slices, or boxes. They fade or 
move into view, in the order you choose. An effect can therefore be referred to as follows:

    parts-transition-order

You can provide a comma separated list from the following, choosing one option from each set
of brackets.

    full-[fade|right|left]
    slice-[up|down|both|fold|fade]-[left|right|in|out|random]
    box-[grow|fade]-[left|right|in|out|random]

e.g. *'slice-up-right,full-fade,box-grow-random'*

#### Shortcuts and wildcards are possible ####

*slice-any-right* means change by slices from left to right using any 
type of animation for each slice

*box-grow* means change by boxes that grow in any order

Any effect that isn't in the above lists will be replaced by a 
random choice.

*slice-gobbledegook-left* is understood as slices using any animation from
right to left.

## License ##

Released under the GNU General Public License version 2 or later.
