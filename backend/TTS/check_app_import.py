import importlib, os, sys
# ensure parent folder (backend) is on sys.path so 'app' can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd(), '..')))
m = importlib.import_module('app')
print('Imported app module OK')
print('HF models folder exists?', os.path.isdir(os.path.join(os.path.abspath(os.path.join(os.getcwd(), '..')), 'hf_models')))
