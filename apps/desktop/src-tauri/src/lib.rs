// src/lib.rs
mod acquiring;
mod fiscal;
mod printing;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.get_webview_window("main").map(|w| w.open_devtools());
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        // ККТ одна на терминал, и состояние у неё своё: открыта ли смена,
        // какой документ записан последним. Поэтому состояние приложения,
        // а не объект на каждый вызов.
        .manage(fiscal::commands::FiscalState::new())
        // Терминал эквайринга — тоже один, и во время операции он занят
        // целиком: гость держит карту у одного устройства.
        .manage(acquiring::commands::AcquiringState::new());

    /*
     * Список команд задан дважды намеренно: `generate_handler!` разворачивается
     * в код на этапе компиляции, и вставить в него элемент по условию нельзя.
     * Разница между ветками ровно одна — сценарии отказов ККТ и терминала,
     * которых в проде не должно существовать вовсе.
     */
    #[cfg(debug_assertions)]
    let builder = builder.invoke_handler(tauri::generate_handler![
        printing::print_ticket,
        printing::open_cash_drawer,
        fiscal::commands::atol_print_lines,
        fiscal::commands::fiscal_configure,
        fiscal::commands::fiscal_status,
        fiscal::commands::fiscal_open_shift,
        fiscal::commands::fiscal_close_shift,
        fiscal::commands::fiscal_x_report,
        fiscal::commands::fiscal_register,
        fiscal::commands::fiscal_print_test,
        fiscal::commands::fiscal_print_image,
        acquiring::commands::acquiring_status,
        acquiring::commands::acquiring_pay,
        acquiring::commands::acquiring_reversal,
        acquiring::commands::acquiring_refund,
        fiscal::commands::fiscal_simulate,
        acquiring::commands::acquiring_simulate,
    ]);

    #[cfg(not(debug_assertions))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        printing::print_ticket,
        printing::open_cash_drawer,
        fiscal::commands::atol_print_lines,
        fiscal::commands::fiscal_configure,
        fiscal::commands::fiscal_status,
        fiscal::commands::fiscal_open_shift,
        fiscal::commands::fiscal_close_shift,
        fiscal::commands::fiscal_x_report,
        fiscal::commands::fiscal_register,
        fiscal::commands::fiscal_print_test,
        fiscal::commands::fiscal_print_image,
        acquiring::commands::acquiring_status,
        acquiring::commands::acquiring_pay,
        acquiring::commands::acquiring_reversal,
        acquiring::commands::acquiring_refund,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
