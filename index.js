// Process @[youtube](youtubeVideoID)
// Process @[vimeo](vimeoVideoID)

'use strict';

// The youtube_parser is from http://stackoverflow.com/a/8260383
function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[7].length == 11) {
        return match[7];
    } else {
        return url;
    }
}


// The vimeo_parser is from http://stackoverflow.com/a/13286930
function vimeo_parser(url) {
    var regExp = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    var match = url.match(regExp);
    if (match) {
        return match[3];
    } else {
        return url;
    }
}

function youku_parser(url) {
    var regExp = /http?:\/\/(?:v\.)?youku.com\/v_show\/id_([\w+]*(.*?)[\s]*)?.*/;
    var match = url.match(regExp);
    if (match) {
        return match[1];
    } else {
        return url;
    }
}


function video_embed(md) {
    function video_return(state, silent) {
        var code,
            serviceEnd,
            serviceStart,
            pos,
            res,
            videoID = '',
            tokens,
            start,
            oldPos = state.pos,
            max = state.posMax;

        // When we add more services, (youtube) might be (youtube|vimeo|youku), for example
        var EMBED_REGEX = /@\[(youtube|vimeo|youku)\]\([\s]*(.*?)[\s]*[\)]/im;


        if (state.src.charCodeAt(state.pos) !== 0x40/* @ */) {
            return false;
        }
        if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) {
            return false;
        }

        var match = EMBED_REGEX.exec(state.src);

        if (!match) {
            return false;
        }

        if (match.length < 3) {
            return false;
        }


        var service = match[1];
        var videoID = match[2];
        if (service.toLowerCase() == 'youtube') {
            videoID = youtube_parser(videoID);
        } else if (service.toLowerCase() == 'vimeo') {
            videoID = vimeo_parser(videoID);
        } else if (service.toLowerCase() == 'youku'){
            videoID = youku_parser(videoID);
        }

        // If the videoID field is empty, regex currently make it the close parenthesis.
        if (videoID === ')') {
            videoID = '';
        }

        serviceStart = state.pos + 2;
        serviceEnd = md.helpers.parseLinkLabel(state, state.pos + 1, false);

        //
        // We found the end of the link, and know for a fact it's a valid link;
        // so all that's left to do is to call tokenizer.
        //
        if (!silent) {
            state.pos = serviceStart;
            state.posMax = serviceEnd;
            state.service = state.src.slice(serviceStart, serviceEnd);
            var newState = new state.md.inline.State(
                service,
                state.md,
                state.env,
                tokens = []
            );
            newState.md.inline.tokenize(newState);

            state.push({
                type: 'video',
                videoID: videoID,
                tokens: tokens,
                service: service,
                level: state.level
            });
        }

        state.pos = pos;
        state.posMax = state.tokens.length;
        console.log("is true!!!");
        return true;
    }

    return video_return;
}

function tokenize_youtube(videoID) {
    var embedStart = '<iframe id="ytplayer" type="text/html" width="640" height="390" src="http://www.youtube.com/embed/';
    var embedEnd = '" frameborder="0"/>';
    return embedStart + videoID + embedEnd;
}

function tokenize_vimeo(videoID) {
    var embedStart = '<iframe id="vimeoplayer" width="500" height="281" src="//player.vimeo.com/video/';
    var embedEnd = '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
    return embedStart + videoID + embedEnd;
}

function tokenize_youku(videoID) {
    var embedStart = '<iframe height=498 width=510 src="http://player.youku.com/embed/';
    var embedEnd = '==" frameborder=0 allowfullscreen></iframe>';
    return embedStart + videoID + embedEnd;
}

function tokenize_video(md) {
    function tokenize_return(tokens, idx, options, env, self) {
        var videoID = md.utils.escapeHtml(tokens[idx].videoID);
        var service = md.utils.escapeHtml(tokens[idx].service);
        if (videoID === '') {
            return '';
        }

        if (service.toLowerCase() === 'youtube') {
            return tokenize_youtube(videoID);
        } else if (service.toLowerCase() === 'vimeo') {
            return tokenize_vimeo(videoID);
        } else if (service.toLowerCase() === 'youku') {
            return tokenize_youku(videoID)
        } else {
            return ('');
        }

    }

    return tokenize_return;
}

function video_plugin(md) {
    md.renderer.rules.video = tokenize_video(md);
    md.inline.ruler.before('emphasis', 'video', video_embed(md));
}

module.exports = video_plugin;
