// https://stackoverflow.com/questions/18229230/dynamically-changing-the-size-of-font-size-based-on-text-length-using-css-and-ht
const output = document.querySelector('#title');
const outputContainer = document.querySelector('#song_square');
const defaultSize = '30px';

function resize_to_fit() {
    console.log('TEST')
    let fontSize = window.getComputedStyle(output).fontSize;
    console.log('fontsize: ' + fontSize)
    console.log('new: ' + (parseFloat(fontSize) - 1) + 'px');
    output.style.fontSize = (parseFloat(fontSize) - 1) + 'px';
    console.log('client width: ' + output.clientWidth + 'container witdth: ' + outputContainer.clientWidth);
    if (output.clientWidth >= outputContainer.clientWidth) {
        resize_to_fit();
    }
    output.style.left= ((500-output.clientWidth) / 2)+ 'px';
}