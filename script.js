document.getElementById('fileUpload').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (file) {
        const fileType = file.type;

        if (fileType === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
            
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            const numPages = pdf.numPages;
            let fullText = '';

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({scale: 2});
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({canvasContext: context, viewport}).promise;
                
                const imgData = canvas.toDataURL('image/png');

                await Tesseract.recognize(imgData, 'eng', {
                    logger: e => console.log(e)
                }).then(out => {
                    fullText += out.data.text + '\n';
                }).catch(err => {
                    console.error(err);
                    document.getElementById('output').innerText = 'Error: ' + err.message;
                });
            }
            document.getElementById('output').innerText = fullText;

        } else if (fileType.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    Tesseract.recognize(img, 'eng', {
                        logger: e => console.log(e)
                    }).then(out => {
                        document.getElementById('output').innerText = out.data.text;
                    }).catch(err => {
                        console.error(err);
                        document.getElementById('output').innerText = 'Error: ' + err.message;
                    });
                };
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('output').innerText = 'Unsupported file type. Please upload an image or PDF.';
        }
    }
});
