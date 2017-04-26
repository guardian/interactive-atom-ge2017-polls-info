import mainTemplate from './src/templates/main.html!text'
import Mustache from 'mustache'
import rp from 'request-promise'

export function render() {
    return rp({
        uri: 'https://interactive.guim.co.uk/docsdata-test/10-vIpZE0YzDUboflfHkI6xZBsAS3U7PwZacbo93aA2E.json',
        json: true
    }).then((data) => {
        var sheets = data.sheets;
        var html = Mustache.render(mainTemplate, sheets);
        return html;
    });
}
