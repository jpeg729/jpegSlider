<?php
/**
 * @package     Mine
 * @subpackage  Content.jpegSlider
 *
 * @copyright   Copyright (C) 2005 - 2014 Open Source Matters, Inc. All rights reserved.
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('_JEXEC') or die;

/**
 * JpegSlider plugin class.
 *
 * @package     Mine
 * @subpackage  Content.jpegSlider
 * @since       3.3
 */
class PlgContentJpegSlider extends JPlugin
{
	/**
	 * Plugin that constructs slideshows in content based on markup.
	 *
	 * @param   string   $context  The context of the content being passed to the plugin.
	 * @param   mixed    &$row     An object with a "text" property or the string to be columnised.
	 * @param   mixed    &$params  Additional parameters.
	 * @param   integer  $page     Optional page number. Unused. Defaults to zero.
	 *
	 * @return  boolean	True on success.
	 */
	public function onContentPrepare($context, &$row, &$params, $page = 0)
	{
		if (is_object($row))
		{
			return $this->_addTags($row->text, $params);
		}

		return $this->_addTags($row, $params);
	}

	/**
	 * Construct slideshow in content based on markup.
	 *
	 * @param   string  &$text    The string to be columnised.
	 * @param   mixed   &$params  Additional parameters.
	 *
	 * @return  boolean  True on success.
	 */
	protected function _addTags(&$text, &$params)
	{
    $offset = 0;
		while (preg_match('/({slider )"([^"]+)" ([0-9]+)x([0-9]+)([^}]*)(})/i', $text, $matches, PREG_OFFSET_CAPTURE, $offset))
    {
      $path = $matches[2][0];
      $localpath = JPath::check(JPATH_SITE . $path);
      $url = JURI::root(true) . $path;
      
      $playlist = is_dir($localpath);
      if ($playlist && substr($path, strlen($path)-1) !== "/") {
        $url .= '/';
        $localpath .= '/';
      }
      
      $width = $matches[3][0];
      $height = $matches[4][0];
      $proportion = $height * 100 / $width;
      
      $options = $matches[5][0];
      
      $document = JFactory::getDocument();
      $document->addStyleSheet(JURI::root(true) . "/media/plg_jpegSlider/jpegSlider.css");
      
      /*
       * Find files and construct markup
       */
      $markup = '';
      if ($playlist) {
        $count = 0;
        foreach (scandir($localpath) as $filename) {
          if ('.' === $filename) continue;
          if ('..' === $filename) continue;
          
          /* Check it is an image file */
          if (is_file($localpath.$filename) && exif_imagetype($localpath.$filename)) {      
            $count++;
            if (empty($markup)) {
              $markup = '
                <!--[if lt IE 7]>
                  <div class="nivoSlider-wrapper theme-default" style="width:' . $width . 'px">
                <![endif]-->
                
                <!--[if gte IE 7]>
                  <div class="nivoSlider-wrapper theme-default" style="max-width:' . $width . 'px">
                <![endif]-->
                
                <!--[if !IE]> -->
                  <div class="nivoSlider-wrapper theme-default" style="max-width:' . $width . 'px">
                <!-- <![endif]-->
                
                <div id="jpegSlider' . $offset . '" class="nivoSlider" style="padding-top:' . $proportion . '%">';
              
              /* Calculate positioning for the first image
               * Positioning for the others is calculated in the browser
               */
              list($image_width, $image_height) = getimagesize($localpath.$filename);
              $image_proportion = $image_height / $image_width * 100;
              if ($image_proportion > $proportion) {
                // Center vertically
                $top = -($image_proportion - $proportion) / (2 * $proportion) * 100;
                $markup .= '<img src="' . $url.$filename . '" style="display:block; top:' . $top . '%;" />';
              } else {
                // Fill available height and center horizontally
                $left = -($proportion / $image_proportion - 1) / 2 * 100;
                $extra = 'style="display:block; width:auto; height:' . $height . 'px; top:0; left:' . $left . '%;"';
                $markup .= '
                  <!--[if lt IE 8]>
                    <img src="' . $url.$filename . '" style="display:block; width:auto; height:' . $height . 'px; top:0; left:' . $left . '%;" />
                  <![endif]-->
                  
                  <!--[if gte IE 8]>
                    <img src="' . $url.$filename . '" style="display:block; width:auto; height:100%; top:0; left:' . $left . '%;" />
                  <![endif]-->
                  
                  <!--[if !IE]> -->
                    <img src="' . $url.$filename . '" style="display:block; width:auto; height:100%; top:0; left:' . $left . '%;" />
                  <!-- <![endif]-->';
              }
            } else {
              $markup .= '<img src="' . $url.$filename . '" />';
            }
          }
        }
        
        if (!empty($markup)) {
          $markup .= '</div></div>';
        }
        
        if ($count > 1) {
          /* A single image doesn't need any treatment to display correctly ??? */
          JHtml::_('jquery.framework');
          $document->addScript(JURI::root(true) . "/media/plg_jpegSlider/jpegSlider.js");
          $document->addScriptDeclaration('
            jQuery(window).load(function() {
              jQuery("#jpegSlider' . $offset . '").jpegSlider();
            });');
        }
      } else {
        $markup = '<div class="alert alert-danger" role="alert">The path given either cannot be found, or is not a folder.</div>';
      }
      
      /*
       * Add markup to page
       */
      $start = $matches[1][1];
      $length = $matches[6][1] - $start + 1;
      $text = substr_replace($text, $markup, $start, $length);

      $offset = $matches[6][1];
		}

		return true;
	}
}
