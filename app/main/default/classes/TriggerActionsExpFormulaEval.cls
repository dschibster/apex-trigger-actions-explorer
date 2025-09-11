public with sharing class TriggerActionsExpFormulaEval {
    
    public class EvalResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String errorMessage;
    }

    
    @AuraEnabled
    public static EvalResult evaluateFormula(String formulaExp, String triggerRecordClass){
        EvalResult res = new EvalResult();
        res.success = true;
        try {
            FormulaEval.FormulaInstance fx;
            fx = Formula.builder()
            .withReturnType(FormulaEval.FormulaReturnType.Boolean)
            .withGlobalVariables(FormulaEval.FormulaGlobal.values())
            .withType(Type.forName(triggerRecordClass))
            .withFormula(formulaExp)
            .build();

        } catch (Exception e) {
            res.errorMessage = e.getMessage();
            if(res.errorMessage.contains('<a')){
                res.errorMessage = res.errorMessage.left(res.errorMessage.indexOf('<a'));
            }
            res.success = false;
        }
        return res;
    }
}