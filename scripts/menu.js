$(document).ready(function() {
   
    $(".button").click(function() {
        $(this).closest(".menu-container").toggleClass("active");
    })

    $('#cssmenu li.has-sub>a').on('click', function () {
        $(this).removeAttr('href');
        var element = $(this).parent('li');
        if (element.hasClass('open')) {
            element.removeClass('open');
            element.find('li').removeClass('open');
            element.find('ul').slideUp();
        }
        else {
            element.addClass('open');
            element.children('ul').slideDown();
            element.siblings('li').children('ul').slideUp();
            element.siblings('li').removeClass('open');
            element.siblings('li').find('li').removeClass('open');
            element.siblings('li').find('ul').slideUp();
        }
    });

    var scrollWidth = getScrollbarWidth();
    $(".menu-container").css({ marginRight: -scrollWidth })
    $(".menu").css("width", "+=" + scrollWidth);
});

function getScrollbarWidth() {
    var scroll,
        noscroll;
    var outer = $("<div></div>"),
        inner = $("<div></div>");

    outer.css({
        width: "100px",
        visibility: "hidden",
        msOverflowStyle: "scrollbar"
    });

    $("body").append(outer);
    noscroll = outer.width();

    outer.css({ overflow: "scroll" });
    inner.css({ width: "100%" });
    outer.append(inner);
    scroll = inner.width();

    //outer.remove();

    return noscroll - scroll;
}
