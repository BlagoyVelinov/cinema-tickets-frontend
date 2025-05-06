$(document).ready(function(){
  $("a.new_window").attr("target", "_blank");
 });

$('.message a').click(function(){
    $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
});