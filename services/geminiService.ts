import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from '../utils/fileUtils';
import type { ActiveFile } from '../App';

const getAiClient = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
        throw new Error("API Key not found in local storage.");
    }
    return new GoogleGenAI({ apiKey });
};

const systemInstruction = `
أنت مساعد دراسي ذكي. مهمتك الأساسية هي الإجابة على أسئلة الطلاب بالاعتماد حصرياً على المعلومات الموجودة داخل ملفات PDF المحددة التي يتم تزويدك بها.

القواعد:
1.  مصدر معلوماتك الوحيد والمطلق هو محتوى ملفات الـ PDF. لا تستخدم أي معلومات من الإنترنت أو أي مصادر خارجية أخرى. إجاباتك يجب أن تكون 100% من المستندات.
2.  عندما لا تجد الإجابة في الملفات، يجب أن ترد بشكل مهذب وواضح باللغة العربية: "عذراً، لم أتمكن من العثور على إجابة لهذا السؤال في المستندات المتوفرة. يُفضل طرح السؤال على الأستاذ مباشرة."
3.  إذا طرح الطالب سؤالاً خارج نطاق المادة الدراسية (مثلاً: "كيف حالك؟" أو سؤال عام)، يجب أن تعتذر بلطف وتُذكّر بوظيفتك الأساسية باللغة العربية: "أنا هنا لمساعدتك في الإجابة على الأسئلة المتعلقة بمحتوى المواد الدراسية. هل لديك أي استفسار حولها؟"
4.  إذا كان السؤال غامضاً، اطلب من الطالب إعادة صياغته بشكل أوضح باللغة العربية، مثال: "لم أفهم سؤالك تماماً، هل يمكنك توضيحه أكثر؟"
5.  استخدم لغة عربية فصحى ومبسطة في إجاباتك.
6.  قدّم إجابات مختصرة ومباشرة. إذا كانت المعلومة طويلة، حاول تلخيصها مع الحفاظ على المضمون.
7.  عند تقديم الإجابة، من المفضل أن تذكر اسم الملف أو القسم في ملف الـ PDF الذي استخرجت منه المعلومة لزيادة الموثوقية.
`;

export const getAnswerFromFiles = async (
  files: File[],
  question: string,
  activeFile: ActiveFile
): Promise<string> => {
  try {
    const ai = getAiClient(); // Get client with key from localStorage

    let filesToProcess: File[];
    if (activeFile === 'all') {
      filesToProcess = files;
    } else {
      filesToProcess = [activeFile];
    }
    
    // Convert all the selected files to base64 and create file parts
    const fileParts = await Promise.all(
      filesToProcess.map(async (file) => {
        const base64 = await fileToBase64(file);
        return {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        };
      })
    );

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          ...fileParts, // Spread the file parts
          {
            text: question,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API Key not found")) {
            return "لم يتم العثور على مفتاح الواجهة البرمجية (API Key). يرجى التأكد من إضافته في الصفحة الرئيسية.";
        }
        if (error.message.includes('API key not valid')) {
            localStorage.removeItem('gemini-api-key');
            return "مفتاح الواجهة البرمجية (API Key) غير صالح. تم حذفه. يرجى تحديث الصفحة وإدخال مفتاح صحيح.";
        }
    }
    return "حدث خطأ أثناء محاولة الحصول على إجابة. يرجى المحاولة مرة أخرى.";
  }
};
