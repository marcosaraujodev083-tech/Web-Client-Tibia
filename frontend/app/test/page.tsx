'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 🌐 Importação do NetworkManager com o novo caminho e sem extensão .ts
import { NetworkManager } from './game/network/services/network-manager';

import EnterGameModal from './modals/EnterGameModal';
import CreateAccountModal from './modals/CreateAccountModal';
import CharacterSelectionModal from './modals/CharacterSelectionModal';

// Importa a conexão segura com o Supabase
import { supabase } from './network/supabaseClient';

// ✅ IMPORTAÇÃO DO BLUEPRINT EXTERNO
import { CHARACTER_BLUEPRINT_BASE } from './network/characterBlueprint';

const DEFAULT_HOST = "127.0.0.1:1337";

export default function TestPage() {
  const router = useRouter();
  const [step, setStep] = useState<'menu' | 'login' | 'create' | 'charlist'>('menu');
  const [status, setStatus] = useState('Aguardando comando...');
  const [loading, setLoading] = useState(false);

  const network = useMemo(() => {
    return new NetworkManager();
  }, []);

  // ✅ FLUXO DE LOGIN INTEGRADO COM O SUPABASE
  const handleLoginSubmit = async (payloadFromModal: any) => {
    setLoading(true);
    setStatus('Autenticando conta no banco...');
    try {
      const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_name', payloadFromModal.account.trim())
        .eq('password', payloadFromModal.password)
        .maybeSingle();

      if (accError) throw new Error(`Erro na conexão com o banco: ${accError.message}`);
      if (!account) throw new Error("Conta ou senha incorretas.");

      setStatus('Carregando personagens...');

      const { data: chars, error: charsError } = await supabase
        .from('characters')
        .select('name, level, vocation, sex, pos_x, pos_y, pos_z')
        .eq('account_id', account.id);

      if (charsError) throw new Error(`Erro ao buscar personagens: ${charsError.message}`);

      const gameSession = {
        account: account.account_name,
        characters: chars || [],
        token: account.id,
        host: DEFAULT_HOST
      };

      sessionStorage.setItem('game_session', JSON.stringify(gameSession));
      setStatus('Login efetuado com sucesso!');
      setStep('charlist');
    } catch (error: any) {
      setStatus('Erro ao conectar.');
      alert(error.message || "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FLUXO DE CADASTRO INTEGRADO COM O SUPABASE
  const handleCreateAccountSubmit = async (payloadFromModal: any) => {
    const formattedCharName = payloadFromModal.name.trim();
    const nameSearch = formattedCharName.toLowerCase().replace(/\s+/g, '');

    setLoading(true);
    setStatus('Salvando nova conta no Supabase...');
    try {
      const { data: accData, error: accError } = await supabase
        .from('accounts')
        .insert([{ account_name: payloadFromModal.account.trim(), password: payloadFromModal.password }])
        .select()
        .single();

      if (accError) {
        if (accError.code === '23505') throw new Error("Esta conta já existe no sistema!");
        throw new Error(accError.message);
      }

      setStatus('Configurando personagem inicial...');

      const baseBlueprint = JSON.parse(JSON.stringify(CHARACTER_BLUEPRINT_BASE));
      baseBlueprint.creatureStatistics.outfit.id = payloadFromModal.sex === 'male' ? 128 : 136;

      const { error: charError } = await supabase
        .from('characters')
        .insert([{
          account_id: accData.id,
          name: formattedCharName,
          name_search: nameSearch,
          sex: payloadFromModal.sex,
          game_data: baseBlueprint
        }]);

      if (charError) {
        if (charError.code === '23505') throw new Error("Este nome de personagem já está em uso!");
        throw new Error(charError.message);
      }

      setStatus('Conta criada com sucesso! Redirecionando...');

      const dummySession = {
        account: accData.account_name,
        characters: [
          {
            name: formattedCharName,
            level: 1,
            vocation: "No Vocation",
            sex: payloadFromModal.sex
          }
        ],
        token: accData.id,
        host: DEFAULT_HOST
      };

      sessionStorage.setItem('game_session', JSON.stringify(dummySession));
      setStep('charlist');

    } catch (error: any) {
      console.error("[CreateAccount Error]", error);
      setStatus('Falha ao criar conta.');
      alert(error.message || "O servidor recusou a criação da conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-stone-200 select-none font-sans antialiased flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center flex flex-col items-center px-6 justify-center">

        {/* TOP BAR STATUS */}
        <div className="mb-12 text-[11px] tracking-widest text-stone-500 uppercase space-y-1 bg-neutral-900/40 px-5 py-2.5 rounded-full border border-neutral-800/50 backdrop-blur-sm w-full">
          <div className="flex gap-3 justify-center mt-1">
            <span>Servidor: <span className="text-amber-500 font-medium">{DEFAULT_HOST}</span></span>
            <span className="text-neutral-700">|</span>
            <span>Status: <span className="text-stone-300 font-medium">{loading ? "Processando..." : "Online"}</span></span>
          </div>
          <div className="text-[9px] text-amber-500/70 mt-1 lowercase italic">{status}</div>
        </div>

        {/* LOGO DA DEFAULT HOME */}
        <div className="mb-10 select-none pointer-events-none">
          <h2 className="text-xs font-bold tracking-[0.3em] text-amber-500/80 uppercase mb-2">The Legacy of</h2>
          <h1 className="text-4xl font-black tracking-wider text-stone-100 uppercase drop-shadow-md">Tibia HTML5</h1>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mt-6" />
        </div>

        {/* NAVEGAÇÃO DOS MENUS */}
        {step === 'menu' && (
          <div className="flex flex-col items-center w-full space-y-3 my-4">
            <button
              onClick={() => setStep('login')}
              className="w-full py-2 text-sm font-medium tracking-[0.2em] uppercase text-stone-400 hover:text-amber-400 transition-colors duration-200 block bg-transparent border-0 outline-none cursor-pointer"
            >
              Enter Game
            </button>
            <button
              onClick={() => setStep('create')}
              className="w-full py-2 text-sm font-medium tracking-[0.2em] uppercase text-stone-400 hover:text-amber-400 transition-colors duration-200 block bg-transparent border-0 outline-none cursor-pointer"
            >
              Create Account
            </button>
          </div>
        )}

        {/* RENDERS DOS COMPONENTES CONFIGURADOS VIA ESTADOS REATIVOS */}
        {step === 'login' && (
          <EnterGameModal
            onClose={() => setStep('menu')}
            onSubmit={handleLoginSubmit}
          />
        )}

        {step === 'create' && (
          <CreateAccountModal
            onClose={() => setStep('menu')}
            onSubmit={handleCreateAccountSubmit}
          />
        )}

        {step === 'charlist' && (
          <CharacterSelectionModal
            onClose={() => setStep('menu')}
            onSelect={(selectedChar) => {
              // Salva o char selecionado na sessão antes de mudar de rota
              const sessionRaw = sessionStorage.getItem('game_session');
              if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                session.selectedCharacter = selectedChar;
                sessionStorage.setItem('game_session', JSON.stringify(session));
              }

              setStatus(`Redirecionando para o ambiente de jogo...`);

              // 🚀 REDIRECIONA PARA A NOVA ROTA DO JOGO
              router.push('test/game-area');
            }}
          />
        )}

      </div>
    </main>
  );
}