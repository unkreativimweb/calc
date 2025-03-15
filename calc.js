function show(num){
    // console.log(num);
    const currentNum = document.getElementById('currentNumber');
    // console.log(currentNum)
    currentNum.textContent += num;
}

function solve(){
    let result;
    const storedField = document.getElementById('storedNumber');
    const storedValue = storedField.textContent
    const currentField = document.getElementById('currentNumber');
    currentExpression = currentField.textContent;
    //remove any whitespace
    currentExpression.replace(/\s/g, '');

    if(isNaN(Array.from(currentExpression)[0]) && storedField.textContent !== ''){
        result = eval(String(storedValue + currentExpression))
    } else {
        result = eval(currentExpression);
    }
    

    storedField.textContent = result;
    currentField.textContent = '';
    return result;
}

function clearDisplay(){
    console.log('clear')
    document.getElementById('storedNumber').textContent = '';
    document.getElementById('currentNumber').textContent = '';
}