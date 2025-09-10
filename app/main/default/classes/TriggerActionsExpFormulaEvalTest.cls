@isTest
public class TriggerActionsExpFormulaEvalTest {
    
    // Test data setup
    @TestSetup
    static void setupTestData() {
        // Create a test account for trigger record testing
        Account testAccount = new Account(
            Name = 'Test Account',
            Type = 'Customer',
            Industry = 'Technology'
        );
        insert testAccount;
    }
    
    @isTest
    static void testEvaluateFormulaSuccess() {
        // Test with a valid formula
        String validFormula = 'true';
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(validFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(true, result.success, 'Formula should be valid');
        System.assertEquals(null, result.errorMessage, 'Error message should be null for valid formula');
    }
    
    @isTest
    static void testEvaluateFormulaInvalidFormula() {
        // Test with an invalid formula syntax
        String invalidFormula = 'invalid_syntax_here';
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(invalidFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(false, result.success, 'Formula should be invalid');
        System.assertNotEquals(null, result.errorMessage, 'Error message should not be null');
        System.assert(result.errorMessage.length() > 0, 'Error message should not be empty');
    }
    
    @isTest
    static void testEvaluateFormulaInvalidClass() {
        // Test with an invalid class name
        String validFormula = 'true';
        String invalidClass = 'NonExistentClass';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(validFormula, invalidClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(false, result.success, 'Should fail with invalid class');
        System.assertNotEquals(null, result.errorMessage, 'Error message should not be null');
        System.assert(result.errorMessage.length() > 0, 'Error message should not be empty');
    }
    
    @isTest
    static void testEvaluateFormulaComplexValidFormula() {
        // Test with a more complex valid formula
        String complexFormula = 'NOT(ISBLANK(Name))';
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(complexFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(true, result.success, 'Complex formula should be valid');
        System.assertEquals(null, result.errorMessage, 'Error message should be null for valid formula');
    }
    
    @isTest
    static void testEvaluateFormulaFieldReference() {
        // Test with field reference formula
        String fieldFormula = 'NOT(ISBLANK(Name))';
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(fieldFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(true, result.success, 'Field reference formula should be valid');
        System.assertEquals(null, result.errorMessage, 'Error message should be null for valid formula');
    }
    
    @isTest
    static void testEvaluateFormulaEmptyFormula() {
        // Test with empty formula
        String emptyFormula = '';
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(emptyFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(false, result.success, 'Empty formula should be invalid');
        System.assertNotEquals(null, result.errorMessage, 'Error message should not be null');
    }
    
    @isTest
    static void testEvaluateFormulaNullFormula() {
        // Test with null formula
        String nullFormula = null;
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(nullFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(false, result.success, 'Null formula should be invalid');
        System.assertNotEquals(null, result.errorMessage, 'Error message should not be null');
    }
    
    @isTest
    static void testEvaluateFormulaNullClass() {
        // Test with null class
        String validFormula = 'true';
        String nullClass = null;
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(validFormula, nullClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(false, result.success, 'Should fail with null class');
        System.assertNotEquals(null, result.errorMessage, 'Error message should not be null');
    }
    
    @isTest
    static void testEvaluateFormulaErrorMessageTruncation() {
        // Test error message truncation when it contains HTML links
        String invalidFormula = 'invalid_syntax_with_html_link';
        String triggerRecordClass = 'Account';
        
        Test.startTest();
        TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(invalidFormula, triggerRecordClass);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(false, result.success, 'Formula should be invalid');
        System.assertNotEquals(null, result.errorMessage, 'Error message should not be null');
        
        // Verify that error message doesn't contain HTML links (if the original error did)
        if (result.errorMessage != null) {
            System.assert(!result.errorMessage.contains('<a'), 'Error message should not contain HTML links');
        }
    }
    
    @isTest
    static void testEvalResultClass() {
        // Test the EvalResult inner class properties
        TriggerActionsExpFormulaEval.EvalResult result = new TriggerActionsExpFormulaEval.EvalResult();
        
        // Test default values
        System.assertEquals(null, result.success, 'Success should be null by default');
        System.assertEquals(null, result.errorMessage, 'ErrorMessage should be null by default');
        
        // Test setting values
        result.success = true;
        result.errorMessage = 'Test error';
        
        System.assertEquals(true, result.success, 'Success should be settable');
        System.assertEquals('Test error', result.errorMessage, 'ErrorMessage should be settable');
    }
    
    @isTest
    static void testEvaluateFormulaWithDifferentSObjectTypes() {
        // Test with different SObject types
        List<String> sObjectTypes = new List<String>{'Account', 'Contact', 'Opportunity'};
        String validFormula = 'true';
        
        Test.startTest();
        for (String sObjectType : sObjectTypes) {
            TriggerActionsExpFormulaEval.EvalResult result = TriggerActionsExpFormulaEval.evaluateFormula(validFormula, sObjectType);
            
            System.assertNotEquals(null, result, 'Result should not be null for ' + sObjectType);
            System.assertEquals(true, result.success, 'Formula should be valid for ' + sObjectType);
            System.assertEquals(null, result.errorMessage, 'Error message should be null for ' + sObjectType);
        }
        Test.stopTest();
    }
}
