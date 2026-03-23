
import React, { useState, useRef } from 'react';
import { Upload, Sparkles, AlertCircle, Download, X, ScanEye, RefreshCw, ShieldCheck, PenTool } from 'lucide-react';
import { editImageWithGemini, analyzeImageForSafety } from '../services/geminiService';

type Mode = 'EDIT' | 'INSPECT';

export const ImageEditor: React.FC = () => {
  const [mode, setMode] = useState<Mode>('EDIT');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, carregue um arquivo de imagem válido.');
      return;
    }

    setMimeType(file.type);
    setError(null);
    setResultImage(null);
    setInspectionResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAction = async () => {
    if (!selectedImage) return;
    if (mode === 'EDIT' && !prompt) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    setInspectionResult(null);

    try {
      const base64Data = selectedImage.split(',')[1];
      
      if (mode === 'EDIT') {
        const editedImage = await editImageWithGemini(base64Data, mimeType, prompt);
        if (editedImage) {
          setResultImage(editedImage);
        } else {
          setError('Falha ao gerar imagem. Tente outro prompt.');
        }
      } else {
        const analysis = await analyzeImageForSafety(base64Data, mimeType);
        setInspectionResult(analysis);
      }
    } catch (err) {
      setError('Ocorreu um erro ao processar a imagem.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setResultImage(null);
    setInspectionResult(null);
    setPrompt('');
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden transition-colors bg-transparent">
      
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ScanEye className="text-emerald-600 dark:text-emerald-500" size={28} />
            Centro de Operações Visuais
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Inspeção visual e processamento generativo via IA.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleClear}
                className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:border-slate-500 rounded-lg transition-all"
            >
                Limpar Área
            </button>
        </div>
      </div>

      <div className="flex mb-6 bg-white dark:bg-slate-900/50 p-1 rounded-lg border border-emerald-100 dark:border-slate-800 w-fit shadow-sm">
        <button 
          onClick={() => setMode('EDIT')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === 'EDIT' ? 'bg-emerald-50 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-emerald-100 dark:border-slate-700' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <PenTool size={16} /> Edição Generativa
        </button>
        <button 
          onClick={() => setMode('INSPECT')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === 'INSPECT' ? 'bg-emerald-50 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-emerald-100 dark:border-slate-700' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <ShieldCheck size={16} /> Inspeção de Segurança
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100%-140px)]">
        
        {/* Left Column: Input */}
        <div className="flex flex-col gap-4 h-full">
            <div className={`flex-1 border-2 border-dashed rounded-xl flex items-center justify-center relative overflow-hidden transition-all ${selectedImage ? 'border-emerald-200 dark:border-slate-700 bg-emerald-50/30 dark:bg-slate-900' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-400 dark:hover:border-slate-600'}`}>
                {selectedImage ? (
                    <img src={selectedImage} alt="Original" className="w-full h-full object-contain p-4" />
                ) : (
                    <div className="text-center p-8">
                        <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">Carregar Imagem</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm">PNG, JPG, WEBP até 10MB</p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-6 px-6 py-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-500 font-medium rounded-lg border border-emerald-100 dark:border-slate-700 transition-colors shadow-sm"
                        >
                            Selecionar Arquivo
                        </button>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            <div className="bg-white dark:bg-slate-850 border border-emerald-100 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm dark:shadow-lg">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    {mode === 'EDIT' ? <Sparkles size={14} className="text-purple-500 dark:text-purple-400" /> : <ShieldCheck size={14} className="text-orange-500 dark:text-orange-400" />}
                    {mode === 'EDIT' ? 'Instrução de Edição' : 'Contexto de Inspeção (Opcional)'}
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'EDIT' ? "ex: 'Destacar tampa de combustível'" : "ex: 'Verificar se calços estão no lugar'"}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    />
                    <button
                        onClick={handleAction}
                        disabled={!selectedImage || (mode === 'EDIT' && !prompt) || isLoading}
                        className={`px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-lg ${
                            !selectedImage || (mode === 'EDIT' && !prompt) || isLoading
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 text-white dark:text-slate-950 hover:bg-emerald-400 dark:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        }`}
                    >
                        {isLoading ? <RefreshCw className="animate-spin" size={16} /> : (mode === 'EDIT' ? <Sparkles size={16} /> : <ShieldCheck size={16} />)}
                        {isLoading ? 'Processando...' : (mode === 'EDIT' ? 'Gerar' : 'Inspecionar')}
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col gap-4 h-full">
             <div className="flex-1 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner dark:shadow-black/50">
                {mode === 'EDIT' && resultImage ? (
                    <img src={resultImage} alt="Result" className="w-full h-full object-contain p-4" />
                ) : mode === 'INSPECT' && inspectionResult ? (
                    <div className="w-full h-full p-6 overflow-auto bg-white dark:bg-slate-950/50">
                        <h4 className="text-slate-800 dark:text-white font-bold mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <ShieldCheck className="text-orange-500" size={20} />
                            Relatório de Segurança Gemini
                        </h4>
                        <div className="text-slate-600 dark:text-slate-300 font-mono text-sm whitespace-pre-line leading-relaxed">
                            {inspectionResult}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 text-slate-500 dark:text-slate-600">
                         {isLoading ? (
                             <div className="flex flex-col items-center gap-4">
                                 <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                                 <p className="text-emerald-600 dark:text-emerald-500/80 font-mono text-sm">
                                    {mode === 'EDIT' ? 'Otimizando Visuais...' : 'Analisando Riscos...'}
                                 </p>
                             </div>
                         ) : (
                             <>
                                <ScanEye className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Saída da IA aparecerá aqui</p>
                             </>
                         )}
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {resultImage && mode === 'EDIT' && (
                <div className="flex justify-end">
                    <a 
                        href={resultImage} 
                        download="jetops_visual_edit.png"
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        Baixar Arquivo
                    </a>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
