// src/main.rs

mod fiscal;
use fiscal::commands::{FiscalState, *};
use std::sync::Mutex;

fn main() {
    // let fiscal_state = FiscalState(Mutex::new(Box::new(fiscal::emulator::Emulator::new())));
    // let atol_device = fiscal::atol::AtolDevice::new("COM3", 115200);
    let atol_device = crate::fiscal::atol::AtolDevice::new("192.168.3.223", 5555);
    let fiscal_state = FiscalState(Mutex::new(Box::new(atol_device)));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(fiscal_state)
        .invoke_handler(tauri::generate_handler![
            fiscal_status,
            fiscal_open_shift,
            fiscal_close_shift,
            fiscal_x_report,
            fiscal_register,
            fiscal_simulate,
            fiscal_print_test,
            fiscal_print_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
